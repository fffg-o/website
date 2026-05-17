/**
 * 迷宫类型定义
 *
 * 迷宫基础设施仅关心：
 * - RoomExport.id: 房间标识，用于生成加密路由
 * - RoomExport.portalSlots: 传送门槽位（房间定义的模板）
 *
 * 具体页面的谜题逻辑由每个 _rooms/*.astro 自行管理。
 */

/** 传送门槽位：房间定义的模板，不含 targetId（由生成器填充） */
export interface PortalSlot {
  label: string;
  description?: string;
}

/** 传送门：包含目标房间 ID 的完整传送门 */
export interface Portal {
  label: string;
  description?: string;
  /** 目标房间 ID（渲染时加密为链接） */
  targetId: string;
}

/**
 * 房间导出数据 —— 每个 _rooms/*.astro 必须导出此类型
 *
 * portalSlots：只定义标签/描述，不定义目标房间。
 *   生成器读取槽位数量后随机分配 targetId。
 *
 * portals（可选）：已完全定义的传送门（含 targetId）。
 *   适用于不需要随机分配的固定房间（如 minimal 开发页）。
 *   当此字段存在时，生成器跳过该房间的随机分配。
 */
export interface RoomExport {
  id: string;
  /**
   * 传送门槽位：房间定义的模板，targetId 由构建脚本填充。
   * 仅定义 label/description，不定义目标房间。
   */
  portalSlots: PortalSlot[];
  /**
   * 已完全定义的传送门（含 targetId）。
   * 可选字段。当存在时，生成器跳过该房间的随机分配，
   * 直接使用此处的 portals 定义。
   * 适用于 minimal 等不需要随机分配的固定房间。
   */
  portals?: Portal[];
}
