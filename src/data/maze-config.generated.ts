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
  /** 起点房间 ID（每次构建随机变化） */
  startRoomId: string;
  /** 所有房间节点（含画布坐标） */
  nodes: MazeConfigNode[];
  /** 房间之间的连接（由槽位分配决定） */
  edges: MazeConfigEdge[];
  /** 每个房间的传送门映射（生成器基于槽位随机分配 targetId） */
  portalsMap: Record<string, Portal[]>;
}

export const mazeConfig: MazeConfig = {
  startRoomId: 'lockpick',
  nodes: [
  {
    "id": "dark-passage",
    "label": "黑暗通道",
    "x": 37.1,
    "y": 29.8
  },
  {
    "id": "final",
    "label": "勇者试炼",
    "x": 67.8,
    "y": 39.2
  },
  {
    "id": "lockpick",
    "label": "符文之门",
    "x": 37.8,
    "y": 60.6
  },
  {
    "id": "treasure",
    "label": "宝藏密室",
    "x": 67.4,
    "y": 64.4
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
    "source": "treasure",
    "target": "lockpick"
  }
],
  portalsMap: {
  "dark-passage": [
    {
      "label": "通道尽头出现了一扇金色大门",
      "description": "门上刻着\"勇者\"二字",
      "targetId": "final"
    },
    {
      "label": "墙上的裂缝透出微光",
      "description": "似乎通向另一个房间",
      "targetId": "lockpick"
    }
  ],
  "final": [
    {
      "label": "🔁 回到起点重新开始",
      "description": "迷宫循环往复……",
      "targetId": "dark-passage"
    },
    {
      "label": "一扇隐藏的秘门",
      "description": "似乎通向未知领域",
      "targetId": "treasure"
    }
  ],
  "lockpick": [
    {
      "label": "石门缓缓打开，露出一个宝库入口",
      "description": "里面金光闪闪",
      "targetId": "dark-passage"
    },
    {
      "label": "旁边出现了一条黑暗的通道",
      "description": "通道深处传来奇怪的回声",
      "targetId": "treasure"
    }
  ],
  "treasure": [
    {
      "label": "回到来时路",
      "description": "身后的门还未关闭",
      "targetId": "final"
    },
    {
      "label": "墙壁上出现了一个暗格",
      "description": "似乎通向另一个空间",
      "targetId": "lockpick"
    }
  ],
  "minimal": [
    {
      "label": "前往符文之门",
      "description": "第一个迷宫房间",
      "targetId": "lockpick"
    },
    {
      "label": "前往宝藏密室",
      "description": "寻宝之旅",
      "targetId": "treasure"
    },
    {
      "label": "前往黑暗通道",
      "description": "探索未知",
      "targetId": "dark-passage"
    },
    {
      "label": "前往勇者试炼",
      "description": "最终挑战",
      "targetId": "final"
    }
  ]
},
};
