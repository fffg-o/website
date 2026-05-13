/**
 * 迷宫地图数据
 *
 * 定义迷宫所有房间的位置、显示名称和连接关系，
 * 供 MazeMap 组件渲染地图使用。
 */

/** 地图上的房间节点 */
export interface MazeNode {
  /** 房间 ID，与 RoomExport.id 一致 */
  id: string;
  /** 显示名称（简短，适合在地图上展示） */
  label: string;
  /** 图标 */
  icon: string;
  /** 在地图 SVG 中的 x 坐标 */
  x: number;
  /** 在地图 SVG 中的 y 坐标 */
  y: number;
}

/** 房间之间的连接 */
export interface MazeEdge {
  from: string;
  to: string;
}

/** 完整的地图定义 */
export interface MazeGraph {
  nodes: MazeNode[];
  edges: MazeEdge[];
}

/**
 * 地图节点位置定义
 *
 * 布局示意：
 *   lockpick ──→ treasure
 *     |              |
 *   dark-passage ──→ final
 *
 * 注意：welcome 页面仅作为迷宫入口，不包含在地图内。
 */
export const mazeGraph: MazeGraph = {
  nodes: [
    { id: 'lockpick',      label: '符文之门',  icon: '🔑', x: 44, y: 8 },
    { id: 'treasure',      label: '宝藏密室',  icon: '💎', x: 108, y: 8 },
    { id: 'dark-passage',  label: '黑暗通道',  icon: '🌑', x: 44, y: 56 },
    { id: 'final',         label: '勇者试炼',  icon: '⚔️', x: 108, y: 56 },
    { id: 'minimal',       label: 'DEV',       icon: '🔧', x: 160, y: 100 },
  ],
  edges: [
    // lockpick → treasure, dark-passage
    { from: 'lockpick', to: 'treasure' },
    { from: 'lockpick', to: 'dark-passage' },
    // treasure → final
    { from: 'treasure', to: 'final' },
    // dark-passage → final, treasure
    { from: 'dark-passage', to: 'final' },
    { from: 'dark-passage', to: 'treasure' },
    // final → lockpick
    { from: 'final', to: 'lockpick' },
    // minimal → all (dev)
    { from: 'minimal', to: 'lockpick' },
    { from: 'minimal', to: 'treasure' },
    { from: 'minimal', to: 'dark-passage' },
    { from: 'minimal', to: 'final' },
  ],
};

/** 根据房间 ID 获取节点信息 */
export function getNodeById(id: string): MazeNode | undefined {
  return mazeGraph.nodes.find((n) => n.id === id);
}

/** localStorage 中存储已访问房间的键名 */
export const VISITED_ROOMS_KEY = 'maze-visited-rooms';
