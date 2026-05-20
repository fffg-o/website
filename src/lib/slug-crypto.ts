/**
 * Slug 生成工具
 *
 * 用于迷宫页面的路由加密：
 * - 使用 HMAC-SHA256 将明文 ID 确定性哈希为十六进制字符串作为 URL slug
 * - 同一 ID 始终生成相同的 slug，确保 dev server 热重载时链接一致
 * - 不加密内容，只混淆路由，防止用户通过猜测 URL 访问隐藏页面
 *
 * 特殊用途（欢迎页）：
 * - encryptSlugRandom() 加入随机盐值，每次构建生成不同的 slug
 * - 用于入口链接，实现"每次都不一样"的效果
 *
 * 密钥来源: 环境变量 CONTENT_KEY (与内容加解密共用同一密钥)
 */

import { createHmac, randomBytes } from 'node:crypto';

/**
 * 获取密钥
 */
function getKey(): Buffer {
  const hex = process.env.CONTENT_KEY;
  if (!hex) {
    throw new Error(
      'CONTENT_KEY 环境变量未设置。构建时需要 64 位十六进制密钥（AES-256 需要 32 字节）。',
    );
  }
  const normalized = hex.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error('CONTENT_KEY 必须是 64 位十六进制字符串（32 字节）。');
  }
  return Buffer.from(normalized, 'hex');
}

/**
 * 将明文 ID 加密为十六进制 slug
 *
 * 使用 HMAC-SHA256 生成哈希：
 * - 不传 salt：同一 ID 始终生成相同的 slug（确定性，向后兼容）
 * - 传 salt：slug = salt + HMAC(plaintext + ":" + salt)，每次构建不同
 *   用于迷宫路由，使每个构建版本的路由都不同
 *
 * @param plaintext - 明文 ID (如 "conway")
 * @param salt - 可选盐值（16 字符十六进制），用于每次构建变化路由
 * @returns 64 字符（无 salt）或 80 字符（带 salt）的十六进制 slug
 */
export function encryptSlug(plaintext: string, salt?: string): string {
  const key = getKey();
  const hmac = createHmac('sha256', key);
  if (salt) {
    hmac.update(plaintext + ':' + salt, 'utf-8');
    return salt + hmac.digest('hex');
  }
  hmac.update(plaintext, 'utf-8');
  return hmac.digest('hex');
}

/**
 * 将明文 ID 加密为随机十六进制 slug
 *
 * 每次构建生成不同的 slug（加入随机盐值）：
 * - 用于欢迎页入口链接，实现"每次都不一样"的效果
 * - 盐值占前 16 字符，HMAC 输出占后 64 字符，共 80 字符
 * - 内部与 encryptSlug 共享同一密钥
 *
 * @param plaintext - 明文 ID (如 "lockpick")
 * @returns 80 字符十六进制字符串（16 盐值 + 64 HMAC），用作 URL slug
 */
export function encryptSlugRandom(plaintext: string): string {
  const key = getKey();
  const salt = randomBytes(8).toString('hex'); // 16 字符盐值
  const hmac = createHmac('sha256', key);
  hmac.update(plaintext + ':' + salt, 'utf-8');
  return salt + hmac.digest('hex'); // 16 + 64 = 80 字符
}

/**
 * 从随机 slug 中提取明文
 *
 * 反向解析 encryptSlugRandom 生成的 slug，
 * 提取前 16 字符作为盐值，用其验证后 64 字符的 HMAC。
 *
 * @param slug - 80 字符的随机十六进制 slug
 * @param expected - 预期的明文 ID
 * @returns 如果 HMAC 匹配返回 expected，否则返回 null
 */
export function verifyRandomSlug(slug: string, expected: string): string | null {
  if (slug.length !== 80) return null;
  const salt = slug.slice(0, 16);
  const hmacPart = slug.slice(16);
  const key = getKey();
  const hmac = createHmac('sha256', key);
  hmac.update(expected + ':' + salt, 'utf-8');
  const expectedHmac = hmac.digest('hex');
  return expectedHmac === hmacPart ? expected : null;
}

/**
 * 解密十六进制 slug 为明文 ID
 *
 * 注意：当前使用 HMAC-SHA256（单向哈希），此函数仅用于
 * 向后兼容。实际查找条目通过 Astro.props 传递，无需此函数。
 *
 * @param _slug - 从 URL 获取的十六进制字符串（未使用）
 * @returns 始终返回 null（单向哈希无法解密）
 * @deprecated 迷宫详情页通过 getStaticPaths props 直接获取条目
 */
export function decryptSlug(_slug: string): string | null {
  return null;
}
