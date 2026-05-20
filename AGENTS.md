# AGENTS.md

## Setup

```bash
cp .env.example .env       # or ensure CONTENT_KEY is set (64 hex chars)
npm install
```

## Commands

```bash
npm run dev           # generate-maze then `astro dev`
npm run build         # generate-maze → astro build → pagefind
npm run create:post   # interactive new blog post (then `npm run encrypt`)
npm run create:note   # interactive new note (then `npm run encrypt`)
npm run encrypt       # encrypt all .md → .md.enc
npm run normalize:all # normalize Chinese text (spacing, full-width punctuation)
```

There are no lint, typecheck, or test scripts. Verification is `npm run build`.

## Architecture

- **Astro** site with **Tailwind CSS v4** (CSS-based via `@tailwindcss/postcss`, theme in `src/styles/global.css`). No `tailwind.config.js`.
- **Deploy**: pushes to `master` trigger `.github/workflows/deploy.yml` → GitHub Pages at `https://fffg-o.github.io/website` (base path `/website`).
- **Content encryption**: all content in `src/content/` is AES-256-GCM encrypted `.md.enc` files. Plain `.md` is gitignored. Edit `.md` locally, then `npm run encrypt` to generate `.md.enc` before commit.
- **Content loader** (`src/loaders/encrypted-content.ts`): custom Astro content loader that decrypts `.md.enc` at build/dev time using `CONTENT_KEY`, does its own simple frontmatter parsing, and pre-renders `$$...$$` block math with KaTeX inline (not via remark-math — micromark's lexer misparses `$$` as fenced code blocks before remark-math can act).
- **Maze page** (`src/pages/maze/`): `scripts/generate-maze.mjs` writes `src/data/maze-config.generated.ts` at build time. The maze is a client-side game rendered from this generated config.

## Important constraints

- `CONTENT_KEY` env var is **required** for `dev`, `build`, `encrypt`, and `create`. It must be exactly 64 hex characters (32 bytes).
- Build order matters: `generate:maze` runs before `astro build`, and `pagefind` runs after. Do not skip or reorder.
- Do not move `$$...$$` math rendering from the loader into remark-math — it will break.
- Node >= 22.12.0 is required (per `engines` field).

## Maze room development rules
当开发或修改迷宫（maze）相关的房间（room）时，必须遵守以下规则：

画面中不要出现文字：所有功能提示、交互说明、状态反馈等，均使用 Emoji 代替文字。避免任何中文、英文或数字字符串（除非作为数据存储的键名，但不显示给用户）

制作 room 时不要引入新的依赖：必须使用项目已有的依赖和原生 Web API 来完成 room 的逻辑和渲染。已有依赖包括但不限于：

Astro, Tailwind CSS v4

项目内已有的工具函数（如 src/lib/ 下的模块）

不新增任何 npm 包。如果当前能力无法实现某个特性，应改用现有能力重新设计实现方案。

## 交互要求
- Reply 回答要用中文回复