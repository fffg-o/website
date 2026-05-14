/**
 * 迷宫通用类型定义
 *
 * 所有房间组件统一使用此处的 Props 接口，
 * 传送门由外部传入而非硬编码。
 *
 * 注意：此文件应保持为纯类型定义，
 * 不要导入任何运行时依赖。
 */

import type { Portal } from '../data/maze';

// 重新导出 Portal，供 maze-config.generated.ts 等文件使用
export type { Portal };

/**
 * 房间组件的标准 Props
 *
 * 所有 _rooms/*.astro 统一通过 Astro.props 接收此接口。
 */
export interface MazeRoomProps {
  /** 当前房间可用的传送门列表 */
  portals: Portal[];
  /**
   * 谜题房间专用：解谜成功后展示的传送门。
   * 与 portals 的区别：nextPortal 在解谜后才显示，
   * 而 portals 中的传送门可直接展示。
   */
  nextPortal?: Portal;
}
