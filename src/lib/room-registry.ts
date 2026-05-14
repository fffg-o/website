/**
 * 房间自动扫描与注册模块
 *
 * 使用 import.meta.glob 自动扫描 _rooms/*.astro，
 * 无需手动导入即可获取所有房间组件的映射和元数据。
 *
 * 注意：
 * - import.meta.glob 是 Vite/Astro 的编译时功能，不支持 Node.js 运行时
 * - 该模块仅在 Astro 构建/开发服务器中运行
 */

import type { RoomExport } from '../data/maze';

// 使用 Astro（Vite）支持的 glob 导入扫描所有房间页面
// eagar: false 表示按需加载（返回动态 import 函数）
const roomModules = import.meta.glob('/src/pages/maze/_rooms/*.astro', { eager: false });

// Vite 的 import.meta.glob 返回 Record<path, () => Promise<Module>>
type RoomModule = { room: RoomExport };

/** 房间 ID → 动态加载函数 的映射 */
type RoomRegistry = Record<string, () => Promise<RoomModule>>;

/**
 * 构建房间注册表
 *
 * 从 import.meta.glob 的路径映射中提取房间 ID，
 * 格式如：{ [roomId]: () => import('...') }
 */
function buildRegistry(): RoomRegistry {
  const registry: RoomRegistry = {};

  for (const [filepath, loader] of Object.entries(roomModules)) {
    // 文件路径格式: /src/pages/maze/_rooms/[id].astro
    // 提取文件名（不含扩展名）作为房间 ID
    const match = filepath.match(/_rooms\/(.+)\.astro$/);
    if (!match) continue;

    const roomId = match[1];
    registry[roomId] = loader as () => Promise<RoomModule>;
  }

  return registry;
}

/** 房间注册表单例 */
let registry: RoomRegistry | null = null;

function getRegistry(): RoomRegistry {
  if (!registry) {
    registry = buildRegistry();
  }
  return registry;
}

/**
 * 获取所有房间的元数据
 *
 * 动态导入每个房间模块，提取 room 导出对象，
 * 返回包含 id、title、description 等信息的数组。
 *
 * @returns 房间元数据数组
 */
export async function getAllRoomsMetadata(): Promise<RoomExport[]> {
  const reg = getRegistry();
  const rooms: RoomExport[] = [];

  for (const [roomId, loader] of Object.entries(reg)) {
    try {
      const mod = await loader();
      if (mod.room) {
        rooms.push(mod.room);
      } else {
        console.warn(`[room-registry] 房间 "${roomId}" 未导出 room 对象`);
      }
    } catch (err) {
      console.error(`[room-registry] 加载房间 "${roomId}" 失败:`, err);
    }
  }

  return rooms;
}

/**
 * 动态加载指定 ID 的房间组件
 *
 * @param id - 房间 ID（不含路径和扩展名）
 * @returns 房间组件的默认导出（Astro 组件）
 */
export async function getRoomComponent(id: string): Promise<unknown> {
  const reg = getRegistry();
  const loader = reg[id];

  if (!loader) {
    throw new Error(`[room-registry] 未找到房间 "${id}"`);
  }

  const mod = await loader();
  // 默认导出是 Astro 组件本身
  return (mod as unknown as { default: unknown }).default;
}

/**
 * 同步获取所有已注册的房间 ID 列表
 *
 * 不加载模块，仅返回 ID 数组。
 * 适用于生成路由等场景。
 */
export function getRegisteredRoomIds(): string[] {
  return Object.keys(getRegistry());
}
