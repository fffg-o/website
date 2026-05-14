#!/usr/bin/env node

/**
 * 构建时迷宫随机生成脚本
 *
 * 功能：
 * 1. 扫描 _rooms 目录获取所有房间 ID
 * 2. 使用随机连通图算法生成迷宫结构
 * 3. 输出 src/data/maze-config.generated.ts 配置文件
 *
 * 环境变量：
 *   MAZE_SEED - 可选，随机种子（设置后每次生成结果一致）
 *
 * 用法：
 *   node scripts/generate-maze.mjs
 *   MAZE_SEED=42 node scripts/generate-maze.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ROOMS_DIR = resolve(ROOT, 'src', 'pages', 'maze', '_rooms');
const OUTPUT_FILE = resolve(ROOT, 'src', 'data', 'maze-config.generated.ts');

// ============================================================
// 简单的种子随机数生成器（Mulberry32 算法）
// ============================================================

class SeededRandom {
  constructor(seed) {
    this.state = seed >>> 0;
  }

  /** 返回 [0, 1) 的伪随机数 */
  next() {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** 返回 [min, max) 的整数 */
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** 从数组中随机取一个元素 */
  pick(arr) {
    return arr[this.nextInt(0, arr.length)];
  }

  /** Fisher-Yates 洗牌 */
  shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// ============================================================
// 房间扫描
// ============================================================

/**
 * 从 _rooms 目录中扫描所有房间文件
 * @returns {string[]} 房间 ID 数组
 */
function scanRoomIds() {
  if (!existsSync(ROOMS_DIR)) {
    console.error(`❌ 房间目录不存在: ${ROOMS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(ROOMS_DIR);
  const roomIds = files
    .filter((f) => f.endsWith('.astro'))
    .map((f) => f.replace(/\.astro$/, ''))
    .sort();

  if (roomIds.length === 0) {
    console.error('❌ 未找到任何房间文件');
    process.exit(1);
  }

  return roomIds;
}

// ============================================================
// 迷宫生成算法（随机 Prim 算法）
// ============================================================

/**
 * 生成随机连通图
 *
 * @param {string[]} roomIds - 所有房间 ID
 * @param {SeededRandom} rng - 随机数生成器
 * @returns {{ nodes: {id:string, label:string, x:number, y:number}[], edges: {source:string, target:string}[] }}
 */
function generateMazeGraph(roomIds, rng) {
  const nodes = roomIds.map((id) => ({
    id,
    label: idToLabel(id),
  }));

  // ---- 生成连通图（随机 Prim） ----

  const edges = [];
  const visited = new Set();
  const frontier = [];

  // 从第一个房间开始
  const startId = roomIds[0];
  visited.add(startId);

  // 将 startId 的所有潜在邻居加入 frontier
  for (const id of roomIds) {
    if (id !== startId) {
      frontier.push([startId, id]);
    }
  }

  // 随机 Prim：不断从 frontier 中随机选一条边连接
  while (frontier.length > 0) {
    const idx = rng.nextInt(0, frontier.length);
    const [from, to] = frontier[idx];
    frontier.splice(idx, 1);

    if (visited.has(to)) continue;

    edges.push({ source: from, target: to });
    visited.add(to);

    // 将新访问的节点的未访问邻居加入 frontier
    for (const id of roomIds) {
      if (!visited.has(id) && id !== to) {
        frontier.push([to, id]);
      }
    }
  }

  // ---- 随机添加额外边（控制度为 2~4） ----

  const degreeMap = new Map();
  for (const id of roomIds) degreeMap.set(id, 0);
  for (const e of edges) {
    degreeMap.set(e.source, degreeMap.get(e.source) + 1);
    degreeMap.set(e.target, degreeMap.get(e.target) + 1);
  }

  // 尝试添加额外边：目标是将大部分节点的度提升到 2~4
  const allPairs = [];
  for (let i = 0; i < roomIds.length; i++) {
    for (let j = i + 1; j < roomIds.length; j++) {
      allPairs.push([roomIds[i], roomIds[j]]);
    }
  }

  const shuffledPairs = rng.shuffle(allPairs);

  for (const [a, b] of shuffledPairs) {
    const da = degreeMap.get(a);
    const db = degreeMap.get(b);

    // 跳过已达最大度的节点
    if (da >= 4 || db >= 4) continue;

    // 检查是否已存在边
    const exists = edges.some(
      (e) => (e.source === a && e.target === b) || (e.source === b && e.target === a),
    );
    if (exists) continue;

    // 至少有一个节点度 < 2 时才添加边
    if (da < 2 || db < 2) {
      edges.push({ source: a, target: b });
      degreeMap.set(a, da + 1);
      degreeMap.set(b, db + 1);
    }
  }

  // ---- 分配画布坐标 ----

  // 简单随机散列布局
  const gridCols = Math.ceil(Math.sqrt(nodes.length));
  const gridRows = Math.ceil(nodes.length / gridCols);
  const spacingX = 100 / (gridCols + 1);
  const spacingY = 100 / (gridRows + 1);

  // 按广度优先顺序分配坐标，使布局更自然
  const bfsOrder = bfsTraversal(roomIds, edges);
  const coordMap = new Map();

  bfsOrder.forEach((id, index) => {
    const col = index % gridCols;
    const row = Math.floor(index / gridCols);

    // 在网格基础上加一些随机偏移，使布局更自然
    const jitterX = (rng.next() - 0.5) * spacingX * 0.4;
    const jitterY = (rng.next() - 0.5) * spacingY * 0.4;

    coordMap.set(id, {
      x: Math.round((spacingX * (col + 1) + jitterX) * 10) / 10,
      y: Math.round((spacingY * (row + 1) + jitterY) * 10) / 10,
    });
  });

  const resultNodes = nodes.map((n) => ({
    ...n,
    x: coordMap.get(n.id).x,
    y: coordMap.get(n.id).y,
  }));

  return { nodes: resultNodes, edges };
}

/**
 * BFS 遍历顺序
 */
function bfsTraversal(ids, edges) {
  const adj = new Map();
  for (const id of ids) adj.set(id, []);
  for (const e of edges) {
    adj.get(e.source).push(e.target);
    adj.get(e.target).push(e.source);
  }

  const visited = new Set();
  const order = [];
  const queue = [ids[0]];

  while (queue.length > 0) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    order.push(cur);

    for (const neighbor of adj.get(cur) || []) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  // 如果有未访问的节点（理论上不应发生），加到末尾
  for (const id of ids) {
    if (!visited.has(id)) order.push(id);
  }

  return order;
}

// ============================================================
// 标签与 Portal 生成
// ============================================================

/**
 * 将 camelCase/kebab-case 的房间 ID 转换为中文友好的标签
 */
function idToLabel(id) {
  const labelMap = {
    welcome: '迷宫入口',
    lockpick: '符文之门',
    treasure: '宝藏密室',
    'dark-passage': '黑暗通道',
    final: '勇者试炼',
    minimal: 'DEV',
  };

  if (labelMap[id]) return labelMap[id];

  // 通用转换：kebab-case → 空格分隔 → 首字母大写
  return id
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * 根据边的方向生成 portal 标签
 */
function generatePortalLabel(fromId, toId) {
  const labels = [
    '一扇古老的门',
    '闪烁的传送门',
    '幽暗的通道',
    '符文环绕的入口',
    '石阶通向远方',
    '藤蔓覆盖的拱门',
    '水晶般的光幕',
    '旋转的魔法漩涡',
    '雕花的木门',
    '铁栅栏后的通道',
  ];

  // 用 from+to 的 hash 确定性选择标签
  const hash = [...(fromId + toId)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return labels[hash % labels.length];
}

/**
 * 根据邻接表生成 portalsMap
 */
function generatePortalsMap(roomIds, edges) {
  // 构建邻接表
  const adj = new Map();
  for (const id of roomIds) adj.set(id, []);

  for (const e of edges) {
    adj.get(e.source).push(e.target);
    adj.get(e.target).push(e.source);
  }

  // 为每个房间生成 Portal 列表
  const portalsMap = {};
  for (const [roomId, neighbors] of adj) {
    portalsMap[roomId] = neighbors.map((neighborId) => ({
      label: generatePortalLabel(roomId, neighborId),
      description: `通往 ${idToLabel(neighborId)}`,
      targetId: neighborId,
    }));
  }

  return portalsMap;
}

// ============================================================
// 输出文件生成
// ============================================================

/**
 * 生成迷宫配置文件的 TypeScript 内容
 */
function generateConfigContent(startRoomId, nodes, edges, portalsMap) {
  const nodesJson = JSON.stringify(nodes, null, 2);
  const edgesJson = JSON.stringify(edges, null, 2);
  const portalsMapJson = JSON.stringify(portalsMap, null, 2);

  return `// ============================================================
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
  startRoomId: '${startRoomId}',
  nodes: ${nodesJson},
  edges: ${edgesJson},
  portalsMap: ${portalsMapJson},
};
`;
}

// ============================================================
// 主流程
// ============================================================

function main() {
  console.log('🏗️  开始生成迷宫配置...\n');

  // 1. 扫描房间
  const roomIds = scanRoomIds();
  console.log(`📁 发现 ${roomIds.length} 个房间:`);
  roomIds.forEach((id) => console.log(`   - ${id}`));
  console.log('');

  // 2. 初始化随机数生成器
  const seedStr = process.env.MAZE_SEED;
  let seed;
  if (seedStr) {
    seed = parseInt(seedStr, 10);
    if (isNaN(seed)) {
      // 用字符串哈希作为种子
      seed = [...seedStr].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    }
    console.log(`🌱 使用指定种子: ${seedStr} → ${seed}`);
  } else {
    seed = Date.now();
    console.log(`🌱 使用时间种子: ${seed}`);
  }

  const rng = new SeededRandom(seed);

  // 3. 生成迷宫图
  const { nodes, edges } = generateMazeGraph(roomIds, rng);
  console.log(`🔗 生成 ${nodes.length} 个节点, ${edges.length} 条边`);

  // 4. 生成 portalsMap
  const portalsMap = generatePortalsMap(roomIds, edges);
  const totalPortals = Object.values(portalsMap).reduce((sum, p) => sum + p.length, 0);
  console.log(`🚪 生成 ${totalPortals} 个传送门`);

  // 5. 确定起点
  const startRoomId = roomIds.includes('welcome') ? 'welcome' : roomIds[0];
  console.log(`🏁 起点房间: ${startRoomId}`);

  // 6. 输出配置文件
  const content = generateConfigContent(startRoomId, nodes, edges, portalsMap);
  writeFileSync(OUTPUT_FILE, content, 'utf-8');

  console.log(`\n✅ 迷宫配置已写入: ${OUTPUT_FILE}`);
  console.log(`   节点数: ${nodes.length}`);
  console.log(`   边数:   ${edges.length}`);
  console.log(`   传送门: ${totalPortals}`);
}

try {
  main();
} catch (e) {
  console.error('❌ 生成迷宫配置失败:', e);
  process.exit(1);
}
