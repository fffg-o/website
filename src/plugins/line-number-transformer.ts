import type { ShikiTransformer } from 'shiki';

/**
 * Shiki transformer: 为代码块添加行号
 *
 * 在每个代码行上添加 `data-line` 属性，
 * 配合 CSS 的 `counter` + `::before` 生成行号显示。
 */
export function transformerAddLineNumber(): ShikiTransformer {
  return {
    name: 'transformer-add-line-number',
    pre(node) {
      this.addClassToHast(node, 'has-line-numbers');
    },
    line(node, line) {
      node.properties['data-line'] = line;
    },
  };
}
