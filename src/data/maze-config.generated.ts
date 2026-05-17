// ============================================================
// 迷宫配置文件 —— 由 scripts/generate-maze.mjs 自动生成
// 请勿手动修改！每次构建都会重新生成。
// ============================================================

import type { Portal } from '../types/maze';

export interface MazeConfigNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface MazeConfigEdge {
  source: string;
  target: string;
}

export interface MazeConfig {
  /** 起点房间 ID */
  startRoomId: string;
  /** 所有房间节点（含画布坐标） */
  nodes: MazeConfigNode[];
  /** 房间之间的连接 */
  edges: MazeConfigEdge[];
  /** 每个房间的传送门映射 */
  portalsMap: Record<string, Portal[]>;
}

export const mazeConfig: MazeConfig = {
  startRoomId: 'dark-passage',
  nodes: [
  {
    "id": "dark-passage",
    "label": "黑暗通道",
    "x": 30.5,
    "y": 29
  },
  {
    "id": "final",
    "label": "勇者试炼",
    "x": 68.9,
    "y": 37.3
  },
  {
    "id": "lockpick",
    "label": "符文之门",
    "x": 35.7,
    "y": 68.4
  },
  {
    "id": "treasure",
    "label": "宝藏密室",
    "x": 63.4,
    "y": 70.2
  }
],
  edges: [
  {
    "source": "dark-passage",
    "target": "final"
  },
  {
    "source": "dark-passage",
    "target": "lockpick"
  },
  {
    "source": "final",
    "target": "treasure"
  },
  {
    "source": "dark-passage",
    "target": "treasure"
  },
  {
    "source": "lockpick",
    "target": "treasure"
  }
],
  portalsMap: {
  "dark-passage": [
    {
      "label": "藤蔓覆盖的拱门",
      "description": "通往 勇者试炼",
      "targetId": "final"
    },
    {
      "label": "闪烁的传送门",
      "description": "通往 符文之门",
      "targetId": "lockpick"
    },
    {
      "label": "雕花的木门",
      "description": "通往 宝藏密室",
      "targetId": "treasure"
    }
  ],
  "final": [
    {
      "label": "藤蔓覆盖的拱门",
      "description": "通往 黑暗通道",
      "targetId": "dark-passage"
    },
    {
      "label": "旋转的魔法漩涡",
      "description": "通往 宝藏密室",
      "targetId": "treasure"
    }
  ],
  "lockpick": [
    {
      "label": "闪烁的传送门",
      "description": "通往 黑暗通道",
      "targetId": "dark-passage"
    },
    {
      "label": "符文环绕的入口",
      "description": "通往 宝藏密室",
      "targetId": "treasure"
    }
  ],
  "treasure": [
    {
      "label": "旋转的魔法漩涡",
      "description": "通往 勇者试炼",
      "targetId": "final"
    },
    {
      "label": "雕花的木门",
      "description": "通往 黑暗通道",
      "targetId": "dark-passage"
    },
    {
      "label": "符文环绕的入口",
      "description": "通往 符文之门",
      "targetId": "lockpick"
    }
  ]
},
};
