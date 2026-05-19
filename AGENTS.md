# AGENTS.md

## Setup

```bash
cp .env.example .env       # or ensure CONTENT_KEY is set (64 hex chars)
export CONTENT_KEY="6d241af0f6ad08b835586483acc0ae5db52d7415be2794e954ff15fc4936040c"
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
