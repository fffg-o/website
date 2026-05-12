/**
 * Slug 生成工具
 *
 * 用于迷宫页面的路由加密：
 * - 使用 HMAC-SHA256 将明文 ID 确定性哈希为十六进制字符串作为 URL slug
 * - 同一 ID 始终生成相同的 slug，确保 dev server 热重载时链接一致
 * - 不加密内容，只混淆路由，防止用户通过猜测 URL 访问隐藏页面
 *
 * 密钥来源: 环境变量 CONTENT_KEY (与内容加解密共用同一密钥)
 */

import { createHmac } from 'node:crypto';

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
 * 将明文 ID 加密为确定性十六进制 slug
 *
 * 使用 HMAC-SHA256 生成确定性哈希，确保：
 * - 同一 ID 始终生成相同的 slug（解决 dev server 热重载一致性）
 * - 无密钥无法预测 slug 值
 *
 * @param plaintext - 明文 ID (如 "maze-welcome")
 * @returns 64 字符十六进制字符串，用作 URL slug
 */
export function encryptSlug(plaintext: string): string {
  const key = getKey();
  const hmac = createHmac('sha256', key);
  hmac.update(plaintext, 'utf-8');
  return hmac.digest('hex');
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
