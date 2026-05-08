// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeCodeTitle from 'rehype-code-title';
import {
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerNotationDiff,
} from '@shikijs/transformers';

// https://astro.build/config
export default defineConfig({
  site: 'https://fffg.github.io',
  base: '',
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
      ],
    },
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
