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
  startRoomId: 'welcome',
  nodes: [
  {
    "id": "dark-passage",
    "label": "黑暗通道",
    "x": 28.5,
    "y": 33.5
  },
  {
    "id": "final",
    "label": "勇者试炼",
    "x": 20.5,
    "y": 61.1
  },
  {
    "id": "lockpick",
    "label": "符文之门",
    "x": 53,
    "y": 30.9
  },
  {
    "id": "minimal",
    "label": "DEV",
    "x": 74.8,
    "y": 70.7
  },
  {
    "id": "treasure",
    "label": "宝藏密室",
    "x": 78.6,
    "y": 38.7
  },
  {
    "id": "welcome",
    "label": "迷宫入口",
    "x": 53,
    "y": 62.4
  }
],
  edges: [
  {
    "source": "dark-passage",
    "target": "lockpick"
  },
  {
    "source": "dark-passage",
    "target": "treasure"
  },
  {
    "source": "lockpick",
    "target": "final"
  },
  {
    "source": "final",
    "target": "welcome"
  },
  {
    "source": "welcome",
    "target": "minimal"
  },
  {
    "source": "final",
    "target": "treasure"
  },
  {
    "source": "final",
    "target": "minimal"
  }
],
  portalsMap: {
  "dark-passage": [
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
      "label": "一扇古老的门",
      "description": "通往 符文之门",
      "targetId": "lockpick"
    },
    {
      "label": "一扇古老的门",
      "description": "通往 迷宫入口",
      "targetId": "welcome"
    },
    {
      "label": "旋转的魔法漩涡",
      "description": "通往 宝藏密室",
      "targetId": "treasure"
    },
    {
      "label": "藤蔓覆盖的拱门",
      "description": "通往 DEV",
      "targetId": "minimal"
    }
  ],
  "lockpick": [
    {
      "label": "闪烁的传送门",
      "description": "通往 黑暗通道",
      "targetId": "dark-passage"
    },
    {
      "label": "一扇古老的门",
      "description": "通往 勇者试炼",
      "targetId": "final"
    }
  ],
  "minimal": [
    {
      "label": "闪烁的传送门",
      "description": "通往 迷宫入口",
      "targetId": "welcome"
    },
    {
      "label": "藤蔓覆盖的拱门",
      "description": "通往 勇者试炼",
      "targetId": "final"
    }
  ],
  "treasure": [
    {
      "label": "雕花的木门",
      "description": "通往 黑暗通道",
      "targetId": "dark-passage"
    },
    {
      "label": "旋转的魔法漩涡",
      "description": "通往 勇者试炼",
      "targetId": "final"
    }
  ],
  "welcome": [
    {
      "label": "一扇古老的门",
      "description": "通往 勇者试炼",
      "targetId": "final"
    },
    {
      "label": "闪烁的传送门",
      "description": "通往 DEV",
      "targetId": "minimal"
    }
  ]
},
};
