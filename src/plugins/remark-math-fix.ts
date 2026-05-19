/**
 * remark-math-fix 插件
 *
 * 修复 context.renderMarkdown() 中 micromark 词法分析阶段，
 * $$...$$ 被误解析为围栏代码块的问题。
 *
 * 工作原理：
 * 1. 在 mdast 转换阶段，查找无语言的代码块（$$ 误解析的结果）
 * 2. 将其转换为 remark-math 可处理的 display math 节点（type: 'math'）
 * 3. remark-math 接收到 math 节点后，在 rehype 阶段由 rehype-katex 渲染为 KaTeX HTML
 *
 * 注意：此插件必须在 remark-math 之前注册，以预先处理误解析的代码块。
 */

import type { Root, Code, Parent } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * 判断代码块内容是否看起来像 LaTeX 数学公式
 */
function looksLikeLatex(text: string): boolean {
  const trimmed = text.trim();

  // 如果没有内容，不是 LaTeX
  if (!trimmed) return false;

  // 如果包含典型的 LaTeX 数学命令，很可能是数学公式
  const latexPatterns = [
    /\\[a-zA-Z]+/,          // 反斜杠命令如 \mathbf, \begin, \sum
    /\\[()\[\]{}]/,          // 括号命令如 \(, \)
    /\\begin\{/,             // \begin{environment}
    /\\end\{/,               // \end{environment}
    /\^[^{]/,                // 上标
    /_[^{]/,                 // 下标
    /\\text\{/,              // \text 命令
    /\\mathbb\{/,            // \mathbb
    /\\mathbf\{/,            // \mathbf
    /\\mathcal\{/,           // \mathcal
    /\\mathrm\{/,            // \mathrm
    /\\displaystyle/,        // \displaystyle
    /\\frac\{/,              // \frac
    /\\sqrt/,                // \sqrt
    /\\sum/,                 // \sum
    /\\int/,                 // \int
    /\\prod/,                // \prod
    /\\lim/,                 // \lim
    /\\to\b/,                // \to
    /\\rightarrow/,          // \rightarrow
    /\\left[\(\[\{]/,        // \left(, \left[, \left\{
    /\\right[\)\]\}]/,       // \right), \right], \right\}
    /\\quad\b/,              // \quad
    /\\qquad\b/,             // \qquad
    /\\pmod\{/,              // \pmod
    /\\binom\{/,             // \binom
    /\\underset\{/,          // \underset
    /\\overset\{/,           // \overset
  ];

  const matchCount = latexPatterns.filter((p) => p.test(trimmed)).length;

  // 如果匹配到 2 个以上 LaTeX 模式，很可能是数学公式
  // 或者如果内容中数学符号（=, +, -, >, < 等）占比高
  if (matchCount >= 2) return true;

  // 检查数学符号密度
  const mathSymbols = (trimmed.match(/[=+\-*/><\^_{}()\[\]]/g) || []).length;
  const alphaChars = (trimmed.match(/[a-zA-Z]/g) || []).length;

  // 如果数学符号较多且包含反斜杠命令，认定为数学公式
  if (matchCount >= 1 && mathSymbols >= 3) return true;

  // 如果主要是数学符号和字母（没有普通文本），也认定为数学公式
  if (mathSymbols >= 5 && alphaChars >= 3) return true;

  return false;
}

/**
 * remark 插件：将误解析为代码块的 LaTeX 公式转换为 math 节点
 */
const remarkMathFix: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const nodesToReplace: Array<{
      node: Code;
      index: number;
      parent: Parent;
    }> = [];

    visit(tree, 'code', (
      node: Code,
      index: number | undefined,
      parent: Parent | undefined,
    ) => {
      if (!parent || index === undefined) return;

      const lang = (node.lang || '').trim().toLowerCase();

      // 只处理没有指定语言（或 lang 为 'math'）的代码块
      // 这些很可能是从 $$ 误解析来的
      if ((lang === '' || lang === 'math') && looksLikeLatex(node.value)) {
        nodesToReplace.push({ node, index, parent });
      }
    });

    // 从后往前替换，避免索引偏移
    for (const { node, index, parent } of nodesToReplace.reverse()) {
      const mathNode = {
        type: 'math',
        value: node.value,
        data: {
          hName: 'div',
          hProperties: { className: ['math-display'] },
        },
        meta: null,
      } as any;

      parent.children.splice(index, 1, mathNode);
    }
  };
};

export default remarkMathFix;
