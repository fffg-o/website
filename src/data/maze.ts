/**
 * 迷宫数据源
 *
 * 迷宫页面不加密内容，只加密路由（URL slug）。
 * 用户可通过迷宫列表页访问，但无法直接猜测 URL。
 *
 * 使用方式：
 * 1. 在此文件中添加新的迷宫条目
 * 2. 每个条目有唯一 id，用于生成加密路由
 * 3. content 为 Markdown 格式的正文内容
 */

export interface MazeEntry {
  /** 唯一标识符，用于生成加密 slug */
  id: string;
  /** 显示标题 */
  title: string;
  /** 简短描述 */
  description: string;
  /** 日期 (YYYY-MM-DD) */
  date: string;
  /** 标签列表 */
  tags: string[];
  /** Markdown 正文内容 */
  content: string;
  /** 是否在列表页显示 */
  visible?: boolean;
}

export const mazeEntries: MazeEntry[] = [
  {
    id: 'maze-welcome',
    title: '欢迎来到迷宫',
    description: '迷宫的入口页面，从这里开始探索加密的路径。',
    date: '2026-05-12',
    tags: ['迷宫', '入门'],
    visible: true,
    content: `# 欢迎来到迷宫

这是一个**路由加密**的隐藏区域。

## 什么是迷宫？

迷宫是一个页面集合，所有页面的路由（URL）都经过加密处理。这意味着：

- 你**无法通过猜测 URL** 来访问任何迷宫页面
- 只有通过迷宫列表页的链接才能进入具体页面
- 每个迷宫页面的链接都是独特且不可猜测的加密字符串

## 如何添加新页面

在 \`src/data/maze.ts\` 中添加新条目即可：

\`\`\`typescript
{
  id: 'my-new-page',       // 唯一 ID
  title: '新页面标题',
  description: '页面描述',
  date: '2026-05-12',
  tags: ['标签1', '标签2'],
  visible: true,
  content: '# 标题\\n\\n正文内容...',
}
\`\`\`

> 提示：\`id\` 字段用于生成加密路由，请使用有意义的英文标识。
> 加密后的 slug 将类似于 \`a1b2c3d4...\` 的形式。
`,
  },
  {
    id: 'maze-links',
    title: '加密链接演示',
    description: '展示如何在页面中插入加密的跳转链接。',
    date: '2026-05-12',
    tags: ['迷宫', '演示'],
    visible: true,
    content: `# 加密链接演示

本页面展示如何在迷宫内使用加密跳转链接。

## 纯文本链接（不加密）

如果你的链接指向迷宫外部（如博客、随笔），可以使用普通链接：

- [博客首页](/blog)
- [随笔](/note)

## 加密链接（迷宫内部）

在迷宫页面内部相互跳转时，需要使用 **加密路由**。

> 注意：在迷宫页面中，你不能直接写 \`/maze/某个页面\`，因为这样 URL 是明文的。
> 你需要使用加密后的 slug。

### 正确做法

在迷宫页面的 Markdown 内容中，如果要链接到其他迷宫页面，需要在渲染后通过 JavaScript 动态插入加密链接，或者在数据源中预先加密 slug 并存储。

当前支持的迷宫页面：

- [欢迎来到迷宫] — 使用 \`/maze/加密字符串\` 访问
- 本页 — 你正在浏览

## 实现原理

1. 每条迷宫条目有一个 \`id\`（如 \`maze-links\`）
2. 在构建时，\`encryptSlug(id)\` 将 id 加密为不可读的十六进制字符串
3. 页面 URL 使用这个加密字符串作为 slug
4. 访问页面时，\`decryptSlug(slug)\` 将加密字符串解密回 id
5. 根据 id 查找对应的迷宫条目并渲染

这样，用户无法直接通过 URL 猜测或访问迷宫页面。
`,
  },
];

/**
 * 根据 ID 查找迷宫条目
 */
export function getMazeEntryById(id: string): MazeEntry | undefined {
  return mazeEntries.find((entry) => entry.id === id);
}

/**
 * 获取所有可见的迷宫条目
 */
export function getVisibleMazeEntries(): MazeEntry[] {
  return mazeEntries.filter((entry) => entry.visible !== false);
}
