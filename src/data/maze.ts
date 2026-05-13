/**
 * 迷宫类型定义
 *
 * 迷宫基础设施仅关心：
 * - RoomExport.id: 房间标识，用于生成加密路由
 * - RoomExport.portals: 跳转链接，用于连接迷宫
 *
 * 具体页面的谜题逻辑由每个 _rooms/*.astro 自行管理。
 */

/** 传送门：直接指向目标房间 */
export interface Portal {
  label: string;
  description?: string;
  /** 目标房间 ID（渲染时加密为链接） */
  targetId: string;
}

/**
 * 房间导出数据 —— 每个 _rooms/*.astro 必须导出此类型
 *
 * 迷宫基础设施只读取 id 和 portals。
 * title / description / date / tags 仅供迷宫列表页展示。
 */
export interface RoomExport {
  id: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  portals: Portal[];
}
