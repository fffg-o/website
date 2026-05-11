#!/usr/bin/env node

/**
 * Markdown 加密/解密脚本
 *
 * 功能:
 *   扫描 src/content/ 下所有 .md 文件，加密为 .md.enc 文件
 *   或反向操作: 将 .md.enc 解密为 .md 文件
 *
 * 环境变量:
 *   CONTENT_KEY - 64 位十六进制密钥 (AES-256-GCM 需要 32 字节)
 *
 * 用法:
 *   node scripts/encrypt.mjs                   加密所有 .md 文件
 *   node scripts/encrypt.mjs --decrypt         解密所有 .md.enc 文件
 *   node scripts/encrypt.mjs --dry             预览加密变更
 *   node scripts/encrypt.mjs <file>            加密单个文件
 *   node scripts/encrypt.mjs --decrypt <file>  解密单个文件
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { resolve, relative, join, extname } from 'node:path';

// ============================================================
// 常量
// ============================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const CONTENT_DIR = resolve(import.meta.dirname, '..', 'src', 'content');

// ============================================================
// 密钥获取
// ============================================================

function getKey() {
  const hex = process.env.CONTENT_KEY;
  if (!hex) {
    console.error('❌ 错误: CONTENT_KEY 环境变量未设置。');
    console.error('   请设置 64 位十六进制密钥: export CONTENT_KEY=<64-hex-chars>');
    process.exit(1);
  }
  const normalized = hex.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    console.error('❌ 错误: CONTENT_KEY 必须是 64 位十六进制字符串（32 字节）。');
    process.exit(1);
  }
  return Buffer.from(normalized, 'hex');
}

// ============================================================
// 加解密核心
// ============================================================

/**
 * 加密 .md 文件内容
 * 输出格式: [12 字节 IV] + [16 字节 Auth Tag] + [密文]
 */
function encryptFile(inputPath, outputPath) {
  const key = getKey();
  const plaintext = readFileSync(inputPath, 'utf-8');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();
  const result = Buffer.concat([iv, tag, encrypted]);
  writeFileSync(outputPath, result);

  const inShort = relative(resolve(import.meta.dirname, '..'), inputPath);
  const outShort = relative(resolve(import.meta.dirname, '..'), outputPath);
  console.log(`  🔒 加密: ${inShort} → ${outShort}`);
}

/**
 * 解密 .md.enc 文件
 */
function decryptFile(inputPath, outputPath) {
  const key = getKey();
  const data = readFileSync(inputPath);

  if (data.length < IV_LENGTH + TAG_LENGTH) {
    console.error(`  ❌ 文件过短或格式错误: ${inputPath}`);
    return false;
  }

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  writeFileSync(outputPath, decrypted, 'utf-8');

  const inShort = relative(resolve(import.meta.dirname, '..'), inputPath);
  const outShort = relative(resolve(import.meta.dirname, '..'), outputPath);
  console.log(`  🔓 解密: ${inShort} → ${outShort}`);
  return true;
}

// ============================================================
// 文件扫描
// ============================================================

function getAllFiles(dir, ext) {
  const files = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

// ============================================================
// 批量处理
// ============================================================

function encryptAll(dryRun) {
  const mdFiles = getAllFiles(CONTENT_DIR, '.md')
    .filter(f => !f.endsWith('.md.enc')); // 排除已加密

  if (mdFiles.length === 0) {
    console.log('📭 没有找到需要加密的 .md 文件。');
    return;
  }

  console.log(`📄 找到 ${mdFiles.length} 个 .md 文件\n`);

  for (const mdPath of mdFiles) {
    const encPath = mdPath + '.enc';
    if (dryRun) {
      const short = relative(resolve(import.meta.dirname, '..'), mdPath);
      console.log(`  📋 [预览] ${short} → ${short}.enc`);
    } else {
      encryptFile(mdPath, encPath);
    }
  }
}

function decryptAll() {
  const encFiles = getAllFiles(CONTENT_DIR, '.md.enc');

  if (encFiles.length === 0) {
    console.log('📭 没有找到 .md.enc 文件。');
    return;
  }

  console.log(`📄 找到 ${encFiles.length} 个 .md.enc 文件\n`);

  let ok = 0;
  for (const encPath of encFiles) {
    const mdPath = encPath.replace(/\.enc$/, '');
    if (decryptFile(encPath, mdPath)) ok++;
  }

  console.log(`\n✅ 完成: ${ok}/${encFiles.length}`);
}

// ============================================================
// 单文件处理
// ============================================================

function processSingleFile(filepath, mode) {
  if (!existsSync(filepath)) {
    console.error(`❌ 文件不存在: ${filepath}`);
    process.exit(1);
  }

  const stat = statSync(filepath);
  if (!stat.isFile()) {
    console.error(`❌ 不是文件: ${filepath}`);
    process.exit(1);
  }

  if (mode === 'encrypt') {
    if (!filepath.endsWith('.md') || filepath.endsWith('.md.enc')) {
      console.error('❌ 仅支持加密 .md 文件');
      process.exit(1);
    }
    encryptFile(filepath, filepath + '.enc');
  } else {
    if (!filepath.endsWith('.md.enc')) {
      console.error('❌ 仅支持解密 .md.enc 文件');
      process.exit(1);
    }
    decryptFile(filepath, filepath.replace(/\.enc$/, ''));
  }
}

// ============================================================
// CLI
// ============================================================

function printUsage() {
  console.log(`
用法:
  node scripts/encrypt.mjs                           加密所有 .md 文件
  node scripts/encrypt.mjs --decrypt                 解密所有 .md.enc 文件
  node scripts/encrypt.mjs --dry                     预览加密变更
  node scripts/encrypt.mjs <file>                    加密单个文件
  node scripts/encrypt.mjs --decrypt <file>          解密单个文件

环境变量:
  CONTENT_KEY  必填。64 位十六进制字符串 (AES-256-GCM 需要 32 字节密钥)

示例:
  export CONTENT_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  node scripts/encrypt.mjs
  node scripts/encrypt.mjs --decrypt src/content/note/20260501.md.enc
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    encryptAll(false);
    return Promise.resolve();
  }

  const flag = args[0];

  if (flag === '--help' || flag === '-h') {
    printUsage();
    return Promise.resolve();
  }

  if (flag === '--dry') {
    encryptAll(true);
    return Promise.resolve();
  }

  if (flag === '--decrypt') {
    if (args[1]) {
      processSingleFile(resolve(process.cwd(), args[1]), 'decrypt');
    } else {
      decryptAll();
    }
    return Promise.resolve();
  }

  // 单个文件加密
  if (!flag.startsWith('--')) {
    processSingleFile(resolve(process.cwd(), flag), 'encrypt');
    return Promise.resolve();
  }

  printUsage();
  return Promise.resolve();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
