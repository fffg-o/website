/**
 * 迷宫 URL 生成工具
 *
 * 将目标房间 ID 转换为加密迷宫链接。
 */

import { encryptSlug } from './slug-crypto';

/**
 * 根据目标房间 ID 生成加密迷宫链接
 *
 * @param targetId - 目标房间 ID（如 "conway"）
 * @param salt - 可选盐值，传入则每次构建路由不同
 * @returns 完整的迷宫路由，如 "/maze/abc123..."
 */
export function getMazeUrl(targetId: string, salt?: string): string {
  return `/maze/${encryptSlug(targetId, salt)}`;
}
