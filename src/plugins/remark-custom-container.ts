import { visit } from 'unist-util-visit';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import type { Root, Paragraph, Html } from 'mdast';

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
 * 判断一个节点是否为 directive 的 label（首个段落带有 directiveLabel 标记）
 */
function isDirectiveLabel(node: any): boolean {
  return (
    node &&
    node.type === 'paragraph' &&
    node.data &&
    node.data.directiveLabel === true
  );
}

/**
 * 将 mdast 子节点列表转为 HTML 字符串
 */
function mdastChildrenToHtml(children: any[]): string {
  if (!children || children.length === 0) return '';

  // 过滤掉 label 节点（首个 paragraph 如果是 label 则跳过）
  const contentNodes = children.filter(
    (child, index) => !(index === 0 && isDirectiveLabel(child))
  );

  if (contentNodes.length === 0) return '';

  // 使用 mdast-util-to-hast 转换子节点为 hast，再用 hast-util-to-html 序列化
  // 创建一个临时的根节点来容纳子节点
  const fakeRoot: any = {
    type: 'root',
    children: contentNodes,
  };

  try {
    const hastTree = toHast(fakeRoot);
    if (!hastTree) return '';

    // toHast 返回的是 Root 节点，取它的 children 序列化
    if (hastTree.type === 'root' && hastTree.children) {
      return hastTree.children
        .map((child: any) => toHtml(child as any))
        .join('');
    }

    return toHtml(hastTree as any);
  } catch {
    // 降级：简单提取文本
    return contentNodes.map((n: any) => n.value || '').join(' ');
  }
}

/**
 * Remark 插件：将自定义容器指令 (`:::note`、`:::info` 等) 转换为原始 HTML 容器。
 *
 * 这个插件在 mdast→hast 转换之前运行，将 containerDirective 节点
 * 替换为 raw `html` 节点，从而避免 mdast-util-to-hast 丢失指令名称信息。
 *
 * 使用方式：
 * ```markdown
 * :::info
 * 这是一条信息内容
 * :::
 * ```
 */
export function remarkCustomContainer() {
  return (tree: Root) => {
    const nodesToReplace: Array<{ node: any; index: number; parent: any }> = [];

    visit(tree, (node: any, index: number | undefined, parent: any | undefined) => {
      if (
        node.type === 'containerDirective' &&
        CONTAINER_TYPES.includes(node.name) &&
        parent &&
        typeof index === 'number'
      ) {
        nodesToReplace.push({ node, index, parent });
      }
    });

    // 反向遍历以避免索引偏移
    for (let i = nodesToReplace.length - 1; i >= 0; i--) {
      const { node, index, parent } = nodesToReplace[i];
      const type = node.name;
      const icon = CONTAINER_ICONS[type] || '📌';
      const title = CONTAINER_TITLES[type] || type;

      const contentHtml = mdastChildrenToHtml(node.children || []);

      const containerHtml = `<div class="custom-container container-${type}">
  <div class="container-header">${icon} ${title}</div>
  <div class="container-content">${contentHtml}</div>
</div>`;

      const htmlNode: Html = {
        type: 'html',
        value: containerHtml,
      };

      parent.children.splice(index, 1, htmlNode);
    }
  };
}
