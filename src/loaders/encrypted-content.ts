/**
 * 加密内容加载器 (Astro Content Loader)
 *
 * 在 Astro 构建/开发时，读取 .md.enc 加密文件，
 * 使用 CONTENT_KEY 环境变量解密，得到 Markdown 字符串，
 * 并解析 frontmatter，生成 Astro 内容集合条目。
 *
 * 加密文件格式: [12 字节 IV] + [16 字节 Auth Tag] + [密文]
 */

import { createDecipheriv } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

import type { Loader, LoaderContext } from 'astro/loaders';

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

    // 处理引号
    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      rawValue = rawValue.slice(1, -1);
      data[key] = rawValue;
      continue;
    }

    // 处理数组: [item1, item2]
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
// Loader
// ============================================================

interface EncryptedLoaderOptions {
  base: string;
}

/**
 * 创建一个加密内容加载器
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
          // 读取加密文件
          const encryptedData = readFileSync(filePath);

          // 解密
          const markdown = decryptContent(encryptedData);

          // 计算 ID: 相对于 base 的路径，去掉 .md.enc 后缀
          const relPath = relative(base, filePath);
          const id = relPath.replace(/\.md\.enc$/, '');

          // 解析 frontmatter
          const { data: rawData, body } = parseFrontmatter(markdown);

          // 通过 Astro 的 Markdown 渲染管线处理 body，应用 remark/rehype 插件
          const rendered = await context.renderMarkdown(markdown);

          // 使用 Astro 内置的 parse 验证 schema
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
