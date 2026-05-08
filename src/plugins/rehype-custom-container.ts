import { visit } from 'unist-util-visit';
import type { Root, Element, Text } from 'hast';

/**
 * 支持的自定义容器类型
 */
const CONTAINER_TYPES = ['note', 'warning', 'tip', 'danger', 'info', 'caution'];

/**
 * 容器类型对应的图标
 */
const CONTAINER_ICONS: Record<string, string> = {
  note: '📝',
  warning: '⚠️',
  tip: '💡',
  danger: '🔥',
  info: 'ℹ️',
  caution: '⚡',
};

/**
 * 容器类型对应的语义标题
 */
const CONTAINER_TITLES: Record<string, string> = {
  note: '笔记',
  warning: '警告',
  tip: '提示',
  danger: '危险',
  info: '信息',
  caution: '注意',
};

/**
 * Rehype 插件：将自定义容器指令转换为带样式的 HTML 容器
 *
 * 配合 remark-directive 使用，将 `:::note`、`:::warning` 等语法
 * 转换成带有样式的 `<div class="custom-container ...">`。
 *
 * 使用方式：
 * ```markdown
 * :::note
 * 这是一条笔记内容
 * :::
 *
 * :::warning
 * 这是一条警告
 * :::
 * ```
 */
export function rehypeCustomContainer() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent: Element | Root | undefined) => {
      if (!parent || index === undefined) return;

      // 检查是否是自定义容器元素
      // remark-directive + remark-rehype 会将 containerDirective 转换为
      // 以指令名称为 tagName 的元素
      if (CONTAINER_TYPES.includes(node.tagName)) {
        const type = node.tagName;
        const icon = CONTAINER_ICONS[type] || '📌';
        const title = CONTAINER_TITLES[type] || type.charAt(0).toUpperCase() + type.slice(1);

        // 创建容器头部
        const headerIcon: Text = { type: 'text', value: icon };
        const headerText: Text = { type: 'text', value: ` ${title}` };
        const header: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['container-header'] },
          children: [headerIcon, headerText],
        };

        // 创建内容包裹层
        const content: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['container-content'] },
          children: node.children || [],
        };

        // 替换原节点为带样式的 div 容器
        node.tagName = 'div';
        node.properties = {
          className: ['custom-container', `container-${type}`],
        };
        node.children = [header, content];
      }
    });
  };
}
