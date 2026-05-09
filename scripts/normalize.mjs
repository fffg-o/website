#!/usr/bin/env node

/**
 * Markdown 书写规范化工具
 *
 * 功能:
 *   1. 中英文之间自动加空格
 *   2. 中文语境下统一使用全角标点符号 (逗号、感叹号、问号、冒号、分号)
 *   3. 跳过 frontmatter / code block / inline code / URL 等特殊语法
 *
 * 用法:
 *   pnpm normalize <file>                  规范化单个文件
 *   pnpm normalize:all                     规范化所有 content 文件
 *   pnpm normalize:all --dry               仅预览变更，不写入
 *   node scripts/normalize.mjs <file>
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';

// ============================================================
// 常量
// ============================================================

/** CJK 统一表意文字 (仅汉字，不含标点) */
const CJK = '\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff';

/** CJK 扩展字符 (汉字 + CJK 标点 + 全角符号) */
const CJK_EXT = `${CJK}\u3000-\u303f\uff00-\uffef`;

/** 拉丁字母 */
const LATIN = 'a-zA-Z';

/** 数字 */
const DIGIT = '0-9';

const CONTENT_DIR = resolve(import.meta.dirname, '..', 'src', 'content');

/** 全角符号映射表 */
const FW_MAP = {
  ',': '\uff0c', // 全角逗号
  '!': '\uff01', // 全角感叹号
  '?': '\uff1f', // 全角问号
  ':': '\uff1a', // 全角冒号
  ';': '\uff1b', // 全角分号
};

// ============================================================
// 规则函数
// ============================================================

/**
 * 规则1: 汉字与拉丁字母/数字之间加空格
 */
function addSpacing(text) {
  const re1 = new RegExp(`([${CJK}])([${LATIN}${DIGIT}])`, 'g');
  const re2 = new RegExp(`([${LATIN}${DIGIT}])([${CJK}])`, 'g');
  return text.replace(re1, '$1 $2').replace(re2, '$1 $2');
}

/**
 * 规则2: 中文语境下的标点符号全角化
 *
 * 仅当标点一侧有中文字符时转换。
 * 括号不转换（技术文档中常混用中英文）。
 * 数字中的小数点、URL 中的点不转换。
 */
function normalizePunct(text) {
  const chars = [...text];
  const len = chars.length;

  for (let i = 0; i < len; i++) {
    const ch = chars[i];

    // 只处理我们需要转换的符号
    if (!(ch in FW_MAP)) continue;

    const prev = i > 0 ? chars[i - 1] : '';
    const next = i < len - 1 ? chars[i + 1] : '';

    // 检查中文上下文
    const hasCN = (prev && isCJKChar(prev)) || (next && isCJKChar(next));
    if (!hasCN) continue;

    // 特殊防护：小数点、URL点
    if (ch === ',') {
      // 数字中的逗号不转换 (如 "1,234")
      if (/^\d$/.test(prev) && /^\d$/.test(next)) continue;
    }

    chars[i] = FW_MAP[ch];
  }

  return chars.join('');
}

/** 判断是否为中文字符 */
function isCJKChar(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0x3000 && cp <= 0x303f) ||
    (cp >= 0xff00 && cp <= 0xffef)
  );
}

// ============================================================
// 行处理
// ============================================================

/**
 * 对一行纯文本应用规范化
 */
function normalizeTextLine(text) {
  let result = text;
  result = addSpacing(result);
  result = normalizePunct(result);
  return result;
}

/**
 * 处理单行，跳过特殊上下文
 */
function processLine(line, inCodeBlock, inFrontmatter) {
  // 特殊上下文：不处理
  if (inCodeBlock || inFrontmatter) return line;

  const t = line.trim();

  // 空行、标题、分隔线直接跳过
  if (
    t === '' ||
    /^#{1,6}\s/.test(t) ||
    /^---+$/.test(t) ||
    /^\*{3,}$/.test(t) ||
    /^_{3,}$/.test(t) ||
    /^```/.test(t)
  ) {
    return line;
  }

  // 包含 inline code：保护代码段
  if (t.includes('`') && (t.match(/`/g) || []).length >= 2) {
    const parts = [];
    const regex = /`[^`]*`/g;
    let last = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      // 处理代码前的文本
      if (match.index > last) {
        parts.push(normalizeTextLine(line.slice(last, match.index)));
      }
      // 保持代码不变
      parts.push(match[0]);
      last = match.index + match[0].length;
    }
    // 处理代码后的文本
    if (last < line.length) {
      parts.push(normalizeTextLine(line.slice(last)));
    }
    return parts.join('');
  }

  // 包含 URL/图片/链接：保守跳过
  if (/https?:\/\//.test(t) || /!\[.*?\]\(/.test(t) || /\[.*?\]\(https?:\/\//.test(t)) {
    return line;
  }

  return normalizeTextLine(line);
}

// ============================================================
// 文件处理
// ============================================================

function normalizeFile(filepath, dryRun) {
  if (!existsSync(filepath)) {
    console.error(`\u274c \u6587\u4ef6\u4e0d\u5b58\u5728: ${filepath}`);
    return false;
  }

  const content = readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  const result = [];
  let inCode = false;
  let inFront = false;
  let fmCount = 0;
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();

    // frontmatter
    if (i === 0 && t === '---') {
      inFront = true;
      fmCount = 0;
      result.push(line);
      continue;
    }
    if (inFront) {
      result.push(line);
      fmCount++;
      if (t === '---' && fmCount > 0) {
        inFront = false;
      }
      continue;
    }

    // code block
    if (/^```/.test(t)) {
      inCode = !inCode;
      result.push(line);
      continue;
    }

    // normal line
    const processed = processLine(line, inCode, inFront);
    if (processed !== line) changed = true;
    result.push(processed);
  }

  if (!changed) {
    const short = relative(resolve(import.meta.dirname, '..'), filepath);
    console.log(`  \u2713 \u65e0\u9700\u4fee\u6539: ${short}`);
    return true;
  }

  if (dryRun) {
    const short = relative(resolve(import.meta.dirname, '..'), filepath);
    console.log(`\n\ud83d\udccb \u9884\u89c8\u53d8\u66f4: ${short}`);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== result[i]) {
        console.log(`  ${'-'.repeat(40)}`);
        console.log(`  - ${lines[i]}`);
        console.log(`  + ${result[i]}`);
      }
    }
    console.log('');
    return true;
  }

  writeFileSync(filepath, result.join('\n'), 'utf-8');
  const short = relative(resolve(import.meta.dirname, '..'), filepath);
  console.log(`  \u2713 \u5df2\u89c4\u8303\u5316: ${short}`);
  return true;
}

// ============================================================
// 批量处理
// ============================================================

function getMarkdownFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function normalizeAll(dryRun) {
  const files = getMarkdownFiles(CONTENT_DIR);
  console.log(`\ud83d\udcc1 \u627e\u5230 ${files.length} \u4e2a Markdown \u6587\u4ef6\n`);
  let ok = 0;
  for (const f of files) {
    if (normalizeFile(f, dryRun)) ok++;
  }
  console.log(`\n\u2705 \u5904\u7406\u5b8c\u6210: ${ok}/${files.length}`);
}

// ============================================================
// CLI
// ============================================================

function printUsage() {
  console.log(`
\u7528\u6cd5:
  pnpm normalize <file>                  \u89c4\u8303\u5316\u5355\u4e2a\u6587\u4ef6
  pnpm normalize:all                     \u89c4\u8303\u5316\u6240\u6709 content \u6587\u4ef6
  pnpm normalize:all --dry              \u4ec5\u9884\u89c8\u53d8\u66f4\uff0c\u4e0d\u5199\u5165

\u793a\u4f8b:
  pnpm normalize src/content/note/20260509.md
  pnpm normalize:all
  pnpm normalize:all --dry
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
    return;
  }

  if (args[0] === 'all' || args[0] === '--all') {
    normalizeAll(args.includes('--dry'));
    return;
  }

  const filepath = resolve(process.cwd(), args[0]);
  const dryRun = args.includes('--dry');

  if (!existsSync(filepath)) {
    console.error(`\u274c \u6587\u4ef6\u4e0d\u5b58\u5728: ${filepath}`);
    process.exit(1);
  }

  normalizeFile(filepath, dryRun);
}

main();
