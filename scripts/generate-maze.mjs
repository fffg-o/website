#!/usr/bin/env node

/**
 * 构建时迷宫随机生成脚本
 *
 * 核心架构：
 * - 房间只定义传送门槽位（portalSlots: { label, description }[]），不含 targetId
 * - 本脚本读取所有房间的槽位数量，随机分配连接关系
 * - 每次构建生成的迷宫结构都不同（除非指定 MAZE_SEED）
 * - 起点房间由随机生成决定，maze.astro 通过 mazeConfig.startRoomId 获取入口
 *
 * 特殊房间：
 * - minimal：已有固定完整 portals（含 targetId），生成器跳过其随机分配
 *
 * 约束：
 * - 没有任何房间的传送门会指向 "minimal"
 * - 每次构建后迷宫的连接都是不同的
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
// 种子随机数生成器（Mulberry32 算法）
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
// 房间扫描与槽位解析
// ============================================================

/**
 * 扫描 _rooms 目录中所有房间文件
 * @returns {string[]} 房间 ID 数组
 */
function scanRoomIds(options = {}) {
  const { exclude = [] } = options;
  if (!existsSync(ROOMS_DIR)) {
    console.error(`❌ 房间目录不存在: ${ROOMS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(ROOMS_DIR);
  return files
    .filter((f) => f.endsWith('.astro'))
    .map((f) => f.replace(/\.astro$/, ''))
    .filter((id) => !exclude.includes(id))
    .sort();
}

/**
 * 解析 .astro 文件中的 portalSlots（传送门槽位）
 *
 * 从 export const room 中提取 portalSlots 数组，
 * 每个槽位只包含 label 和可选的 description，不含 targetId。
 *
 * @param {string} filePath
 * @returns {{ label: string, description?: string }[] | null}
 *   返回 null 表示文件中没有 portalSlots 定义
 */
function parsePortalSlots(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  const match = content.match(/portalSlots:\s*\[([\s\S]*?)\]\s*[,\n;]/);
  if (!match) return null;

  const arrayContent = match[1];
  const slots = [];

  // 提取每个 { ... } 对象
  const objRegex = /\{([^}]+)\}/g;
  let objMatch;
  while ((objMatch = objRegex.exec(arrayContent)) !== null) {
    const block = objMatch[1];

    const labelMatch =
      block.match(/label:\s*'([^']*)'/) || block.match(/label:\s*"([^"]*)"/);
    const descMatch =
      block.match(/description:\s*'([^']*)'/) ||
      block.match(/description:\s*"([^"]*)"/);

    if (labelMatch) {
      slots.push({
        label: labelMatch[1],
        description: descMatch ? descMatch[1] : undefined,
      });
    }
  }

  return slots;
}

/**
 * 解析 .astro 文件中的 portals（完整传送门，含 targetId）
 *
 * 从 export const room 中提取 portals 数组，
 * 每个传送门包含 label、description 和 targetId。
 * 适用于已完全定义的固定房间（如 minimal）。
 *
 * @param {string} filePath
 * @returns {{ label: string, description?: string, targetId: string }[] | null}
 *   返回 null 表示文件中没有 portals 定义
 */
function parseCompletePortals(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  const match = content.match(/^\s*portals:\s*\[([\s\S]*?)\]\s*[,\n;]/m);
  if (!match) return null;

  const arrayContent = match[1];
  const portals = [];

  // 提取每个 { ... } 对象
  const objRegex = /\{([^}]+)\}/g;
  let objMatch;
  while ((objMatch = objRegex.exec(arrayContent)) !== null) {
    const block = objMatch[1];

    const labelMatch =
      block.match(/label:\s*'([^']*)'/) || block.match(/label:\s*"([^"]*)"/);
    const targetMatch =
      block.match(/targetId:\s*'([^']*)'/) || block.match(/targetId:\s*"([^"]*)"/);
    const descMatch =
      block.match(/description:\s*'([^']*)'/) ||
      block.match(/description:\s*"([^"]*)"/);

    if (labelMatch && targetMatch) {
      portals.push({
        label: labelMatch[1],
        description: descMatch ? descMatch[1] : undefined,
        targetId: targetMatch[1],
      });
    }
  }

  return portals.length > 0 ? portals : null;
}

/**
 * 扫描所有房间文件，读取每个房间的 portalSlots 和 portals
 *
 * @param {string[]} roomIds
 * @returns {{
 *   slotLists: Record<string, { label: string, description?: string }[]>,
 *   fixedPortals: Record<string, { label: string, description?: string, targetId: string }[]>
 * }}
 *   slotLists: 只有 portalSlots 的房间（需要生成器分配 targetId）
 *   fixedPortals: 已有完整 portals 的房间（生成器跳过）
 */
function scanRoomPortalSlots(roomIds) {
  const slotLists = {};
  const fixedPortals = {};

  for (const id of roomIds) {
    const filePath = resolve(ROOMS_DIR, `${id}.astro`);
    if (!existsSync(filePath)) {
      console.warn(`⚠️  房间文件不存在: ${id}.astro，跳过`);
      slotLists[id] = [];
      continue;
    }

    // 优先检查是否有完整 portals（含 targetId）—— 如 minimal
    const completePortals = parseCompletePortals(filePath);
    if (completePortals) {
      fixedPortals[id] = completePortals;
      slotLists[id] = []; // 不参与生成
      console.log(`   📋 ${id}: ${completePortals.length} 个固定传送门（跳过生成）`);
      continue;
    }

    // 否则读取 portalSlots（仅槽位，需要生成器分配）
    const slots = parsePortalSlots(filePath);
    slotLists[id] = slots || [];
    console.log(`   📋 ${id}: ${slotLists[id].length} 个传送门槽位`);
  }

  return { slotLists, fixedPortals };
}

// ============================================================
// 迷宫生成算法（基于槽位的随机连接）
// ============================================================

/**
 * 基于房间传送门槽位生成随机连通图，并为每个槽位分配目标房间。
 *
 * 算法：
 * 1. 随机 Prim 生成最小生成树，确保所有房间连通
 * 2. 每条边消耗两端各一个槽位
 * 3. 剩余槽位用于添加额外边（增加连接冗余度）
 * 4. 每个槽位的目标房间随机分配（受图结构约束）
 *
 * @param {string[]} roomIds - 参与迷宫的房间（不含 welcome/minimal）
 * @param {Record<string, { label: string, description?: string }[]>} slotLists
 * @param {SeededRandom} rng
 * @returns {{ edges: {source:string,target:string}[], portalsMap: Record<string,{label:string,description?:string,targetId:string}[]> }}
 */
function generateMazeConnections(roomIds, slotLists, rng) {
  // ---- 准备数据结构 ----

  // 每个房间剩余的可用槽位数
  const remaining = {};
  // 每个房间已分配的传送门（label, description, targetId）
  const assignments = {};
  for (const id of roomIds) {
    remaining[id] = slotLists[id] ? slotLists[id].length : 0;
    assignments[id] = [];
  }

  /**
   * 为房间分配一个槽位，指向目标房间
   * @returns {boolean} 是否成功分配
   */
  function assignSlot(roomId, targetId) {
    const slots = slotLists[roomId];
    if (!slots) return false;
    const used = assignments[roomId].length;
    if (used >= slots.length) return false;

    assignments[roomId].push({
      label: slots[used].label,
      description: slots[used].description,
      targetId,
    });
    remaining[roomId]--;
    return true;
  }

  function hasSlot(roomId) {
    return remaining[roomId] > 0;
  }

  // ---- 步骤 1: 生成连通图（随机 Prim） ----

  const edges = [];
  const visited = new Set();
  const frontier = [];

  // 从第一个房间开始
  const startId = roomIds[0];
  visited.add(startId);

  // 将 startId 到所有其他房间的潜在连接加入 frontier
  for (const id of roomIds) {
    if (id !== startId && hasSlot(startId)) {
      frontier.push([startId, id]);
    }
  }

  while (frontier.length > 0) {
    const idx = rng.nextInt(0, frontier.length);
    const [from, to] = frontier[idx];
    frontier.splice(idx, 1);

    if (visited.has(to)) continue;
    if (!hasSlot(from) || !hasSlot(to)) continue;

    // 分配槽位：from 的槽位指向 to，to 的槽位指向 from
    assignSlot(from, to);
    assignSlot(to, from);
    edges.push({ source: from, target: to });
    visited.add(to);

    // 将新访问节点的未访问邻居加入 frontier
    for (const id of roomIds) {
      if (!visited.has(id) && id !== to && hasSlot(to)) {
        frontier.push([to, id]);
      }
    }
  }

  // ---- 步骤 2: 处理未连通节点 ----
  // 如果某些节点因槽位不足未能连通，尝试强制连接

  for (const id of roomIds) {
    if (!visited.has(id)) {
      for (const vid of visited) {
        if (vid !== id && hasSlot(vid) && hasSlot(id)) {
          assignSlot(id, vid);
          assignSlot(vid, id);
          edges.push({ source: id, target: vid });
          visited.add(id);
          break;
        }
      }
    }
  }

  // ---- 步骤 3: 用剩余槽位添加额外边 ----

  // 构建已有边集合，用于快速查重
  const existingEdgeSet = new Set();
  for (const e of edges) {
    existingEdgeSet.add([e.source, e.target].sort().join('::'));
  }

  // 收集所有仍有剩余槽位的房间
  const roomsWithSlots = roomIds.filter((id) => hasSlot(id));

  // 尝试在所有有剩余槽位的房间对之间添加边
  const shuffledRooms = rng.shuffle(roomsWithSlots);
  for (let i = 0; i < shuffledRooms.length; i++) {
    for (let j = i + 1; j < shuffledRooms.length; j++) {
      const a = shuffledRooms[i];
      const b = shuffledRooms[j];
      if (!hasSlot(a) || !hasSlot(b)) continue;

      const edgeKey = [a, b].sort().join('::');
      if (existingEdgeSet.has(edgeKey)) continue;

      assignSlot(a, b);
      assignSlot(b, a);
      edges.push({ source: a, target: b });
      existingEdgeSet.add(edgeKey);
    }
  }

  // ---- 构建 portalsMap（仅包含已分配的槽位） ----

  const portalsMap = {};
  for (const id of roomIds) {
    portalsMap[id] = assignments[id];
  }

  // 打印每个房间的度信息
  const degreeMap = {};
  for (const id of roomIds) degreeMap[id] = 0;
  for (const e of edges) {
    degreeMap[e.source]++;
    degreeMap[e.target]++;
  }

  console.log('\n📊 房间连接度:');
  for (const id of roomIds) {
    const used = assignments[id].length;
    const total = slotLists[id] ? slotLists[id].length : 0;
    console.log(`   ${id}: ${degreeMap[id]} 条边, ${used}/${total} 槽位已用`);
  }

  return { edges, portalsMap };
}

// ============================================================
// 标签生成（用于节点显示）
// ============================================================

function idToLabel(id) {
  const labelMap = {
    lockpick: '符文之门',
    treasure: '宝藏密室',
    'dark-passage': '黑暗通道',
    final: '勇者试炼',
    minimal: 'DEV',
  };

  if (labelMap[id]) return labelMap[id];

  return id
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================
// BFS 遍历顺序（用于坐标分配）
// ============================================================

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

  for (const id of ids) {
    if (!visited.has(id)) order.push(id);
  }

  return order;
}

// ============================================================
// 输出文件生成
// ============================================================

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

  // ---- 1. 扫描所有房间 ----
  const allRoomIds = scanRoomIds();
  console.log(`📁 发现 ${allRoomIds.length} 个房间:`);
  allRoomIds.forEach((id) => console.log(`   - ${id}`));
  console.log('');

  // ---- 2. 读取每个房间的 portalSlots / portals 定义 ----
  console.log('🔍 读取房间传送门信息...');
  const { slotLists, fixedPortals } = scanRoomPortalSlots(allRoomIds);

  const totalSlots = Object.values(slotLists).reduce(
    (sum, slots) => sum + slots.length, 0,
  );
  const totalFixed = Object.values(fixedPortals).reduce(
    (sum, portals) => sum + portals.length, 0,
  );
  console.log(`\n🚪 待生成槽位: ${totalSlots} 个，固定传送门: ${totalFixed} 个\n`);

  // ---- 3. 初始化随机数生成器 ----
  const seedStr = process.env.MAZE_SEED;
  let seed;
  if (seedStr) {
    seed = parseInt(seedStr, 10);
    if (isNaN(seed)) {
      seed = [...seedStr].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    }
    console.log(`🌱 使用指定种子: ${seedStr} → ${seed}`);
  } else {
    seed = Date.now();
    console.log(`🌱 使用时间种子: ${seed}`);
  }

  const rng = new SeededRandom(seed);

  // ---- 4. 确定迷宫主房间 ----
  //    排除: minimal（固定传送门开发页）、已有完整 portals 的房间
  //    约束: 没有任何房间的传送门会指向 minimal
  const graphRoomIds = allRoomIds.filter(
    (id) => id !== 'minimal' && !fixedPortals[id],
  );
  console.log(`🎲 迷宫主房间 (${graphRoomIds.length} 个):`);
  graphRoomIds.forEach((id) => console.log(`   - ${id}`));
  console.log('');

  // ---- 5. 生成迷宫连接 ----
  const { edges, portalsMap } = generateMazeConnections(
    graphRoomIds,
    slotLists,
    rng,
  );
  console.log(`\n🔗 共 ${edges.length} 条边`);

  // ---- 6. 合并固定传送门 ----
  //    已有完整 portals 的房间（如 minimal）直接使用其定义
  for (const [id, portals] of Object.entries(fixedPortals)) {
    portalsMap[id] = portals;
    console.log(`   📌 ${id}: ${portals.length} 个固定传送门（已保留）`);
  }

  // ---- 7. 生成节点坐标 ----
  const nodes = graphRoomIds.map((id) => ({
    id,
    label: idToLabel(id),
  }));

  const gridCols = Math.ceil(Math.sqrt(nodes.length));
  const gridRows = Math.ceil(nodes.length / gridCols);
  const spacingX = 100 / (gridCols + 1);
  const spacingY = 100 / (gridRows + 1);

  const bfsOrder = bfsTraversal(graphRoomIds, edges);
  const coordMap = new Map();

  bfsOrder.forEach((id, index) => {
    const col = index % gridCols;
    const row = Math.floor(index / gridCols);
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

  // ---- 8. 随机选择起点房间 ----
  const startRoomId = rng.pick(graphRoomIds);
  console.log(`\n🏁 随机起点房间: ${startRoomId} (${idToLabel(startRoomId)})`);

  // ---- 9. 统计传送门总数 ----
  const totalPortals = Object.values(portalsMap).reduce(
    (sum, p) => sum + p.length, 0,
  );
  console.log(`\n🚪 传送门总数: ${totalPortals} 个`);

  // ---- 10. 输出配置文件 ----
  const content = generateConfigContent(
    startRoomId,
    resultNodes,
    edges,
    portalsMap,
  );
  writeFileSync(OUTPUT_FILE, content, 'utf-8');

  console.log(`\n✅ 迷宫配置已写入: ${OUTPUT_FILE}`);
  console.log(`   主房间数: ${resultNodes.length}`);
  console.log(`   边数:     ${edges.length}`);
  console.log(`   传送门:   ${totalPortals} 个`);
  console.log(`   起点:     ${startRoomId} (${idToLabel(startRoomId)})`);
}

try {
  main();
} catch (e) {
  console.error('❌ 生成迷宫配置失败:', e);
  process.exit(1);
}
