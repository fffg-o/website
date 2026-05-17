// ============================================================
// 迷宫配置文件 —— 由 scripts/generate-maze.mjs 自动生成
// 请勿手动修改！每次构建都会重新生成。
// ============================================================

import type { Portal } from '../data/maze';

// ---- MazeConfig（供路由/传送门使用） ----

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
  startRoomId: 'final',
  nodes: [
  {
    "id": "dark-passage",
    "label": "黑暗通道",
    "x": 34.2,
    "y": 36.7
  },
  {
    "id": "final",
    "label": "勇者试炼",
    "x": 70.7,
    "y": 65
  },
  {
    "id": "lockpick",
    "label": "符文之门",
    "x": 70,
    "y": 28.8
  },
  {
    "id": "treasure",
    "label": "宝藏密室",
    "x": 32.4,
    "y": 65.3
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
    "source": "treasure",
    "target": "final"
  }
],
  portalsMap: {
  "dark-passage": [
    {
      "label": "通道尽头出现了一扇金色大门",
      "description": "门上刻着\"勇者\"二字",
      "targetId": "lockpick"
    },
    {
      "label": "墙上的裂缝透出微光",
      "description": "似乎通向另一个房间",
      "targetId": "treasure"
    }
  ],
  "final": [
    {
      "label": "🔁 回到起点重新开始",
      "description": "迷宫循环往复……",
      "targetId": "lockpick"
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
      "targetId": "final"
    }
  ],
  "treasure": [
    {
      "label": "回到来时路",
      "description": "身后的门还未关闭",
      "targetId": "dark-passage"
    },
    {
      "label": "墙壁上出现了一个暗格",
      "description": "似乎通向另一个空间",
      "targetId": "final"
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
    },
    {
      "label": "1",
      "description": "1",
      "targetId": "test"
    }
  ]
},
};

// ---- MazeGraph（供 MazeMap 地图组件使用） ----

export interface MazeGraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface MazeGraphEdge {
  from: string;
  to: string;
}

export interface MazeGraph {
  nodes: MazeGraphNode[];
  edges: MazeGraphEdge[];
}

/**
 * 迷宫地图数据 —— 与 maze-config 数据同源，
 * 仅边格式使用 from/to（与 MazeGraph 类型兼容）。
 */
export const mazeGraph: MazeGraph = {
  nodes: [
  {
    "id": "dark-passage",
    "label": "黑暗通道",
    "x": 34.2,
    "y": 36.7
  },
  {
    "id": "final",
    "label": "勇者试炼",
    "x": 70.7,
    "y": 65
  },
  {
    "id": "lockpick",
    "label": "符文之门",
    "x": 70,
    "y": 28.8
  },
  {
    "id": "treasure",
    "label": "宝藏密室",
    "x": 32.4,
    "y": 65.3
  }
],
  edges: [
  {
    "from": "dark-passage",
    "to": "lockpick"
  },
  {
    "from": "dark-passage",
    "to": "treasure"
  },
  {
    "from": "lockpick",
    "to": "final"
  },
  {
    "from": "treasure",
    "to": "final"
  }
],
};
