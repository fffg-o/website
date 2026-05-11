#!/usr/bin/env node

/**
 * 快速创建博客 / 随笔
 *
 * 用法:
 *   pnpm create:post        # 交互式创建博客
 *   pnpm create:note        # 交互式创建随笔
 *
 *   # 或直接传参（非交互式）:
 *   node scripts/create.mjs blog "标题" -d "描述" -t "标签1,标签2"
 *   node scripts/create.mjs note "标题" -d "描述" -t "标签1,标签2" -s "系列名"
 *
 * 注意:
 *   创建 .md 文件后会自动加密为 .md.enc（如果 CONTENT_KEY 环境变量已设置）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createCipheriv, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------- helpers ----------

function today() {
  const d = new Date();
  // Asia/Shanghai
  const offset = 8 * 60;
  const local = new Date(d.getTime() + offset * 60_000);
  return local.toISOString().slice(0, 10);
}

function todayCompact() {
  return today().replace(/-/g, '');
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5\-]/g, '')
    .replace(/\-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled';
}

function kebabCase(text) {
  // 中文保持原样, 英文转 kebab
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, '')
    .replace(/\-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ---------- readline ----------

function ask(query) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------- build frontmatter ----------

function buildFrontmatter(fields) {
  let yaml = '---\n';
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      yaml += `${k}: [${v.map(i => `"${i}"`).join(', ')}]\n`;
    } else {
      // 所有字符串统一双引号包裹，避免 YAML 解析歧义
      yaml += `${k}: "${String(v)}"\n`;
    }
  }
  yaml += '---\n';
  return yaml;
}

// ---------- create blog ----------

async function createBlog(opts) {
  const { explicit } = opts;
  const date = explicit.has('date') ? (opts.date || today()) : today();
  const title = opts.title || await ask('📝 博客标题: ');
  const description = explicit.has('description')
    ? (opts.description ?? '')
    : ((await ask('📄 描述 (可选): ')) || '');
  const tagsRaw = explicit.has('tags')
    ? (opts.tags ?? '')
    : (await ask('🏷️  标签 (逗号分隔, 可选): '));
  const series = explicit.has('series')
    ? (opts.series ?? '')
    : (await ask('📚 系列 (可选): '));

  const tags = tagsRaw
    ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    : [];

  const slug = kebabCase(title);
  const filename = `${slug}.md`;
  const dir = join(ROOT, 'src', 'content', 'blog');
  ensureDir(dir);
  const filepath = join(dir, filename);

  if (existsSync(filepath)) {
    console.error(`❌ 文件已存在: ${filepath}`);
    process.exit(1);
  }

  const fields = { title, description, date, tags, series };
  const fm = buildFrontmatter(fields);
  const content = `${fm}\n# ${title}\n\n`;

  writeFileSync(filepath, content, 'utf-8');
  console.log(`✅ 博客已创建: ${filepath}`);

  // 自动加密
  tryEncrypt(filepath);
}

// ---------- create note ----------

async function createNote(opts) {
  const { explicit } = opts;
  const date = explicit.has('date') ? (opts.date || today()) : today();
  const compact = date.replace(/-/g, '');
  const defaultTitle = compact;

  const title = opts.title || (await ask(`📝 标题 (默认 ${defaultTitle}): `)) || defaultTitle;
  const description = explicit.has('description')
    ? (opts.description ?? '')
    : ((await ask('📄 描述 (可选): ')) || '');
  const tagsRaw = explicit.has('tags')
    ? (opts.tags ?? '')
    : (await ask('🏷️  标签 (逗号分隔, 可选): '));

  const tags = tagsRaw
    ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean)
    : [];

  // 找当日最大序号
  const dir = join(ROOT, 'src', 'content', 'note');
  ensureDir(dir);

  const existing = existsSync(dir)
    ? readdirSync(dir).filter(f => f.startsWith(compact) && f.endsWith('.md'))
    : [];

  let suffix = '';
  if (existing.length > 0) {
    // 如果有同一天的文件，加后缀 -2, -3 ...
    const nums = existing
      .map(f => f.replace(compact, '').replace(/.md$/, '').replace(/^\-/, ''))
      .filter(Boolean)
      .map(Number)
      .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 1;
    suffix = `-${max + 1}`;
  }

  const filename = `${compact}${suffix}.md`;
  const filepath = join(dir, filename);

  if (existsSync(filepath)) {
    console.error(`❌ 文件已存在: ${filepath}`);
    process.exit(1);
  }

  const fields = { title, description, date, tags };
  const fm = buildFrontmatter(fields);
  const content = `${fm}\n`;

  writeFileSync(filepath, content, 'utf-8');
  console.log(`✅ 随笔已创建: ${filepath}`);

  // 自动加密
  tryEncrypt(filepath);
}

// ---------- CLI ----------

async function main() {
  const args = process.argv.slice(2);
  const type = args[0];

  // parse --flags, track which flags were explicitly set
  const parsed = { title: null, description: null, tags: null, series: null, date: null };
  const explicit = new Set();
  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '-d' || arg === '--description') {
      parsed.description = args[++i] ?? null;
      explicit.add('description');
    } else if (arg === '-t' || arg === '--tags') {
      parsed.tags = args[++i] ?? null;
      explicit.add('tags');
    } else if (arg === '-s' || arg === '--series') {
      parsed.series = args[++i] ?? null;
      explicit.add('series');
    } else if (arg === '--date') {
      parsed.date = args[++i] ?? null;
      explicit.add('date');
    } else if (!arg.startsWith('-')) {
      if (!parsed.title) parsed.title = arg;
    }
    i++;
  }

  // wrap create functions so they know which fields were explicitly set
  const opts = { ...parsed, explicit };

  if (type === 'blog') {
    await createBlog(opts);
  } else if (type === 'note') {
    await createNote(opts);
  } else {
    console.log(`
用法:
  pnpm create:post        交互式创建博客
  pnpm create:note        交互式创建随笔

  或直接传参:
  node scripts/create.mjs blog "标题" -d "描述" -t "标签1,标签2" -s "系列名"
  node scripts/create.mjs note "标题" -d "描述" -t "标签1,标签2"
`);
    process.exit(1);
  }
}

// ============================================================
// 自动加密辅助
// ============================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function tryEncrypt(mdPath) {
  const keyHex = process.env.CONTENT_KEY;
  if (!keyHex) {
    // 没有 CONTENT_KEY 则跳过加密（开发环境正常运行）
    return;
  }

  const normalized = keyHex.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    console.warn('⚠️  CONTENT_KEY 格式无效，跳过自动加密');
    return;
  }

  const key = Buffer.from(normalized, 'hex');
  const plaintext = readFileSync(mdPath, 'utf-8');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();
  const result = Buffer.concat([iv, tag, encrypted]);

  const encPath = mdPath + '.enc';
  writeFileSync(encPath, result);
  console.log(`🔒 已加密: ${encPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
