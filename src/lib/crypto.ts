/**
 * AES-256-GCM 加密/解密工具
 *
 * 密钥来源: 环境变量 CONTENT_KEY (64 位十六进制字符串 = 32 字节)
 *
 * 加密输出文件格式 (`.md.enc`):
 *   [12 字节 IV] + [16 字节 GCM Auth Tag] + [密文]
 *
 * 用法 (运行时):
 *   import { encrypt, decrypt } from './crypto';
 *   const plaintext = decrypt(encryptedBuffer);
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // GCM 推荐 12 字节 IV
const TAG_LENGTH = 16;  // GCM 认证标签长度

/**
 * 获取 AES-256 密钥
 * 从环境变量 CONTENT_KEY 读取 64 位十六进制字符串，转为 32 字节 Buffer
 */
function getKey(): Buffer {
  const hex = process.env.CONTENT_KEY;
  if (!hex) {
    throw new Error(
      'CONTENT_KEY 环境变量未设置。请设置 64 位十六进制密钥（AES-256 需要 32 字节）。',
    );
  }
  const normalized = hex.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(
      'CONTENT_KEY 必须是 64 位十六进制字符串（32 字节）。',
    );
  }
  return Buffer.from(normalized, 'hex');
}

/**
 * 加密明文字符串
 *
 * @param plaintext - 待加密的 UTF-8 字符串
 * @returns Buffer - [12 字节 IV] + [16 字节 Auth Tag] + [密文]
 */
export function encrypt(plaintext: string): Buffer {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * 解密 Buffer
 *
 * @param data - [12 字节 IV] + [16 字节 Auth Tag] + [密文]
 * @returns 解密后的 UTF-8 字符串
 */
export function decrypt(data: Buffer): string {
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
