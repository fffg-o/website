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
    "x": 28.9,
    "y": 31.6
  },
  {
    "id": "final",
    "label": "勇者试炼",
    "x": 26.9,
    "y": 62.6
  },
  {
    "id": "lockpick",
    "label": "符文之门",
    "x": 71,
    "y": 70.6
  },
  {
    "id": "minimal",
    "label": "DEV",
    "x": 49.1,
    "y": 27.3
  },
  {
    "id": "treasure",
    "label": "宝藏密室",
    "x": 49.8,
    "y": 63.2
  },
  {
    "id": "welcome",
    "label": "迷宫入口",
    "x": 75.5,
    "y": 29.8
  }
],
  edges: [
  {
    "source": "dark-passage",
    "target": "minimal"
  },
  {
    "source": "minimal",
    "target": "welcome"
  },
  {
    "source": "welcome",
    "target": "treasure"
  },
  {
    "source": "minimal",
    "target": "final"
  },
  {
    "source": "welcome",
    "target": "lockpick"
  },
  {
    "source": "minimal",
    "target": "treasure"
  },
  {
    "source": "dark-passage",
    "target": "welcome"
  },
  {
    "source": "final",
    "target": "lockpick"
  }
],
  portalsMap: {
  "dark-passage": [
    {
      "label": "水晶般的光幕",
      "description": "通往 DEV",
      "targetId": "minimal"
    },
    {
      "label": "闪烁的传送门",
      "description": "通往 迷宫入口",
      "targetId": "welcome"
    }
  ],
  "final": [
    {
      "label": "藤蔓覆盖的拱门",
      "description": "通往 DEV",
      "targetId": "minimal"
    },
    {
      "label": "一扇古老的门",
      "description": "通往 符文之门",
      "targetId": "lockpick"
    }
  ],
  "lockpick": [
    {
      "label": "水晶般的光幕",
      "description": "通往 迷宫入口",
      "targetId": "welcome"
    },
    {
      "label": "一扇古老的门",
      "description": "通往 勇者试炼",
      "targetId": "final"
    }
  ],
  "minimal": [
    {
      "label": "水晶般的光幕",
      "description": "通往 黑暗通道",
      "targetId": "dark-passage"
    },
    {
      "label": "闪烁的传送门",
      "description": "通往 迷宫入口",
      "targetId": "welcome"
    },
    {
      "label": "藤蔓覆盖的拱门",
      "description": "通往 勇者试炼",
      "targetId": "final"
    },
    {
      "label": "雕花的木门",
      "description": "通往 宝藏密室",
      "targetId": "treasure"
    }
  ],
  "treasure": [
    {
      "label": "符文环绕的入口",
      "description": "通往 迷宫入口",
      "targetId": "welcome"
    },
    {
      "label": "雕花的木门",
      "description": "通往 DEV",
      "targetId": "minimal"
    }
  ],
  "welcome": [
    {
      "label": "闪烁的传送门",
      "description": "通往 DEV",
      "targetId": "minimal"
    },
    {
      "label": "符文环绕的入口",
      "description": "通往 宝藏密室",
      "targetId": "treasure"
    },
    {
      "label": "水晶般的光幕",
      "description": "通往 符文之门",
      "targetId": "lockpick"
    },
    {
      "label": "闪烁的传送门",
      "description": "通往 黑暗通道",
      "targetId": "dark-passage"
    }
  ]
},
};
