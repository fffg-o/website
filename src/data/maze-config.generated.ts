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
  startRoomId: 'lockpick',
  nodes: [
  {
    "id": "conway",
    "label": "Conway",
    "x": 29.5,
    "y": 29
  },
  {
    "id": "dark-passage",
    "label": "黑暗通道",
    "x": 28.7,
    "y": 69.1
  },
  {
    "id": "final",
    "label": "勇者试炼",
    "x": 50.9,
    "y": 27.3
  },
  {
    "id": "lights-out",
    "label": "Lights Out",
    "x": 55,
    "y": 62.9
  },
  {
    "id": "lockpick",
    "label": "符文之门",
    "x": 78.3,
    "y": 31.3
  },
  {
    "id": "treasure",
    "label": "宝藏密室",
    "x": 70.2,
    "y": 61.3
  }
],
  edges: [
  {
    "source": "conway",
    "target": "final"
  },
  {
    "source": "final",
    "target": "dark-passage"
  },
  {
    "source": "conway",
    "target": "lockpick"
  },
  {
    "source": "dark-passage",
    "target": "treasure"
  },
  {
    "source": "treasure",
    "target": "lights-out"
  },
  {
    "source": "lights-out",
    "target": "lockpick"
  }
],
  portalsMap: {
  "conway": [
    {
      "label": "",
      "description": "",
      "targetId": "final"
    },
    {
      "label": "",
      "description": "",
      "targetId": "lockpick"
    }
  ],
  "dark-passage": [
    {
      "label": "通道尽头出现了一扇金色大门",
      "description": "门上刻着\"勇者\"二字",
      "targetId": "final"
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
      "targetId": "conway"
    },
    {
      "label": "一扇隐藏的秘门",
      "description": "似乎通向未知领域",
      "targetId": "dark-passage"
    }
  ],
  "lights-out": [
    {
      "label": "",
      "description": "",
      "targetId": "treasure"
    },
    {
      "label": "",
      "description": "",
      "targetId": "lockpick"
    }
  ],
  "lockpick": [
    {
      "label": "石门缓缓打开，露出一个宝库入口",
      "description": "里面金光闪闪",
      "targetId": "conway"
    },
    {
      "label": "旁边出现了一条黑暗的通道",
      "description": "通道深处传来奇怪的回声",
      "targetId": "lights-out"
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
      "targetId": "lights-out"
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
      "label": "test",
      "description": "test",
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
    "id": "conway",
    "label": "Conway",
    "x": 29.5,
    "y": 29
  },
  {
    "id": "dark-passage",
    "label": "黑暗通道",
    "x": 28.7,
    "y": 69.1
  },
  {
    "id": "final",
    "label": "勇者试炼",
    "x": 50.9,
    "y": 27.3
  },
  {
    "id": "lights-out",
    "label": "Lights Out",
    "x": 55,
    "y": 62.9
  },
  {
    "id": "lockpick",
    "label": "符文之门",
    "x": 78.3,
    "y": 31.3
  },
  {
    "id": "treasure",
    "label": "宝藏密室",
    "x": 70.2,
    "y": 61.3
  }
],
  edges: [
  {
    "from": "conway",
    "to": "final"
  },
  {
    "from": "final",
    "to": "dark-passage"
  },
  {
    "from": "conway",
    "to": "lockpick"
  },
  {
    "from": "dark-passage",
    "to": "treasure"
  },
  {
    "from": "treasure",
    "to": "lights-out"
  },
  {
    "from": "lights-out",
    "to": "lockpick"
  }
],
};
