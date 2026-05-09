// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeCodeTitle from 'rehype-code-title';
import remarkEmoji from 'remark-emoji';
import remarkDirective from 'remark-directive';
import {
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerNotationDiff,
} from '@shikijs/transformers';
import { transformerAddLineNumber } from './src/plugins/line-number-transformer';
import { remarkCustomContainer } from './src/plugins/remark-custom-container';

// https://astro.build/config
export default defineConfig({
  site: 'https://fffg-o.github.io',
  base: '/website',
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
      transformers: [
        transformerNotationHighlight(),
        transformerNotationFocus(),
        transformerNotationDiff(),
        transformerAddLineNumber(),
      ],
    },
    remarkPlugins: [
      remarkEmoji,
      remarkDirective,
      remarkCustomContainer,
    ],
    rehypePlugins: [
      rehypeCodeTitle,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: {
            class: 'heading-anchor',
            ariaHidden: 'true',
            tabIndex: -1,
          },
        },
      ],
    ],
  },
});
