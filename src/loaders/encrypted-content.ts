/**
 * 加密内容加载器 (Astro Content Loader)
 *
 * 在 Astro 构建/开发时，读取 .md.enc 加密文件，
 * 使用 CONTENT_KEY 环境变量解密，得到 Markdown 字符串，
 * 并解析 frontmatter，生成 Astro 内容集合条目。
 *
 * 加密文件格式: [12 字节 IV] + [16 字节 Auth Tag] + [密文]
 *
 * 数学公式处理策略：
 * - $$...$$ 块级公式：在 loader 中用 KaTeX 直接预渲染，因为 micromark
 *   的词法分析器会将 $$...$$ 误解析为围栏代码块，remark-math 无法介入。
 *   预渲染的完整 KaTeX HTML（含 MathML）嵌入 markdown 文本，通过
 *   renderMarkdown 管线时被当作原始 HTML 保留。
 * - $...$ 内联公式：交由 remark-math + rehype-katex 管线正常处理。
 * - MathML 元素由 CSS（global.css 中的 .katex .katex-mathml 规则）隐藏，
 *   无需在代码中移除，保证 HTML 结构完整性。
 */

import { createDecipheriv } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

import type { Loader, LoaderContext } from 'astro/loaders';
import katex from 'katex';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// ============================================================
// 密钥获取
// ============================================================

function getKey(): Buffer {
  const hex = process.env.CONTENT_KEY;
  if (!hex) {
    throw new Error(
      'CONTENT_KEY 环境变量未设置。' +
      '构建时需要 64 位十六进制密钥（AES-256 需要 32 字节）。',
    );
  }
  const normalized = hex.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error('CONTENT_KEY 必须是 64 位十六进制字符串（32 字节）。');
  }
  return Buffer.from(normalized, 'hex');
}

// ============================================================
// 解密
// ============================================================

function decryptContent(data: Buffer): string {
  const key = getKey();

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf-8');
}

// ============================================================
// Frontmatter 解析 (简易版)
// ============================================================

/**
 * 从解密后的 Markdown 文本中解析 frontmatter
 * 返回 { data, body }
 */
function parseFrontmatter(content: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const lines = content.split('\n');

  // 必须以 --- 开头
  if (lines.length < 2 || lines[0].trim() !== '---') {
    return { data: {}, body: content };
  }

  // 找结束的 ---
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { data: {}, body: content };
  }

  const fmLines = lines.slice(1, endIndex);
  const body = lines.slice(endIndex + 1).join('\n');

  // 简易 YAML 解析 (仅处理 key: value 形式)
  const data: Record<string, unknown> = {};
  for (const line of fmLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let rawValue: string = trimmed.slice(colonIdx + 1).trim();

    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      rawValue = rawValue.slice(1, -1);
      data[key] = rawValue;
      continue;
    }

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      const inner = rawValue.slice(1, -1);
      if (inner.trim() === '') {
        data[key] = [];
      } else {
        data[key] = inner.split(',').map((item) => {
          const t = item.trim();
          if (
            (t.startsWith('"') && t.endsWith('"')) ||
            (t.startsWith("'") && t.endsWith("'"))
          ) {
            return t.slice(1, -1);
          }
          return t;
        });
      }
      continue;
    }

    data[key] = rawValue;
  }

  if (typeof data.date === 'string') {
    const parts = data.date.split('-');
    if (parts.length === 3) {
      const y = parts[0].padStart(4, '0');
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      data.date = `${y}-${m}-${d}`;
    }
  }

  return { data, body };
}

// ============================================================
// 文件扫描
// ============================================================

function findEncryptedFiles(baseDir: string): string[] {
  const results: string[] = [];

  function scan(dir: string) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md.enc')) {
        results.push(fullPath);
      }
    }
  }

  scan(baseDir);
  return results.sort();
}

// ============================================================
// 数学公式处理
// ============================================================

/**
 * 预渲染 $$...$$ 块级数学公式为 KaTeX HTML
 *
 * 原因：micromark 词法分析阶段会先将 $$...$$ 解析为围栏代码块，
 * 导致 remark-math 的块级扩展无法处理。在 loader 中预渲染可以
 * 绕过这一问题，生成的 HTML 会原样通过 markdown 渲染管线。
 *
 * MathML 不在此处移除：它由 global.css 中的
 * .katex .katex-mathml 规则隐藏（clip: rect），
 * 移除 MathML 会破坏 KaTeX 的输出完整性。
 *
 * @param markdown - 原始 markdown 文本
 * @returns 预处理后的 markdown（$$...$$ 已被替换为 KaTeX HTML）
 */
function preprocessBlockMath(markdown: string): string {
  return markdown.replace(
    /\$\$\n?([\s\S]*?)\n?\$\$/g,
    (_match: string, texContent: string) => {
      const trimmed = texContent.trim();
      if (!trimmed) return _match;
      try {
        return katex.renderToString(trimmed, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        return _match;
      }
    },
  );
}

// ============================================================
// Loader
// ============================================================

interface EncryptedLoaderOptions {
  base: string;
}

/**
 * 创建一个加密内容加载器
 *
 * 数学公式处理管线：
 * 1. 预渲染阶段：将 $$...$$ 块级公式用 KaTeX 转成 HTML 嵌入 markdown
 * 2. context.renderMarkdown() 阶段：内联 $...$ 由 remark-math + rehype-katex 渲染
 * 3. CSS 隐藏阶段：所有 MathML 元素由 global.css 规则隐藏
 *
 * @param options.base - 内容目录的基础路径
 */
export function encryptedContent(options: EncryptedLoaderOptions): Loader {
  const { base } = options;

  return {
    name: 'encrypted-content-loader',

    load: async (context: LoaderContext): Promise<void> => {
      const { store, logger } = context;

      if (!existsSync(base)) {
        logger.warn(`内容目录不存在: ${base}`);
        return;
      }

      const encFiles = findEncryptedFiles(base);
      logger.info(`找到 ${encFiles.length} 个加密文件`);

      for (const filePath of encFiles) {
        try {
          const encryptedData = readFileSync(filePath);
          const markdown = decryptContent(encryptedData);
          const relPath = relative(base, filePath);
          const id = relPath.replace(/\.md\.enc$/, '');
          const { data: rawData, body } = parseFrontmatter(markdown);

          // 预渲染 $$...$$ 块级公式，内联 $...$ 保留给 remark-math 处理
          // 注意：只对 body（去除 frontmatter）进行预处理和渲染，
          // 否则 frontmatter 会被当作 markdown 正文渲染为可见文本。
          const preprocessedBody = preprocessBlockMath(body);
          const rendered = await context.renderMarkdown(preprocessedBody);

          const entry = {
            id,
            data: rawData,
            body,
            rendered: {
              html: rendered.html,
              metadata: rendered.metadata,
            },
          };

          store.set(entry);
        } catch (err) {
          const shortPath = relative(process.cwd(), filePath);
          logger.error(`处理加密文件失败: ${shortPath}`);
          logger.error(String(err));
        }
      }
    },
  };
}
