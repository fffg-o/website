# fffg 个人网站

基于 [Astro](https://astro.build)  + [Tailwind CSS](https://tailwindcss.com)  构建的个人网站，部署于 Github Pages

## 项目结构

```
website/
├── public/                     # 静态资源
│   ├── favicon.svg / .ico      # 网站图标
│   ├── fffg.jpg                # 头像
│   └── images/                 # 文章图片
│       ├── 20260425/
│       └── 20260501/
├── scripts/                    # 命令行工具
│   ├── create.mjs              # 创建博客/随笔（交互式或参数式）
│   ├── encrypt.mjs             # 加解密 .md ↔ .md.enc 文件
│   └── normalize.mjs           # 中文文本规范化（加空格、全角标点）
├── src/
│   ├── components/             # UI 组件
│   │   ├── Hero.astro          # 首页英雄区（头像、简介）
│   │   ├── FeaturedPosts.astro # 首页最新文章
│   │   ├── FeaturedProjects.astro # 首页精选项目
│   │   ├── Contact.astro       # 联系方式（GitHub、Telegram、Email）
│   │   ├── Search.astro        # Pagefind 全文搜索弹窗
│   │   ├── TOC.astro           # 文章目录（桌面端侧边栏 + 移动端抽屉同步）
│   │   ├── SeriesNav.astro     # 博客系列文章导航
│   │   ├── ReadingTime.astro   # 阅读时间估算
│   │   ├── ScrollButtons.astro # 回到顶部/跳到底部浮动按钮
│   │   └── ...
│   ├── content/                # 加密内容集合
│   │   ├── blog/               # 技术博客（支持 series 系列分组）
│   │   ├── note/               # 随笔/日常记录
│   │   └── projects/           # 项目展示
│   ├── content.config.ts       # Astro 内容集合定义（含 Zod 校验）
│   ├── layouts/
│   │   └── Layout.astro        # 全局布局（导航栏、暗色模式、移动端抽屉、页脚彩蛋）
│   ├── lib/
│   │   └── crypto.ts           # AES-256-GCM 加密/解密库
│   ├── loaders/
│   │   └── encrypted-content.ts # 自定义 Astro 内容加载器（解密 + frontmatter 解析）
│   ├── pages/                  # 路由页面
│   │   ├── index.astro         # 首页
│   │   ├── blog.astro          # 博客列表
│   │   ├── blog/[slug].astro   # 博客详情
│   │   ├── note.astro          # 随笔列表
│   │   ├── note/[slug].astro   # 随笔详情（含上下篇导航）
│   │   ├── projects.astro      # 项目展示
│   │   └── 404.astro           # 自定义 404 页面
│   ├── plugins/                # Markdown 插件
│   │   ├── line-number-transformer.ts  # Shiki 行号转换器
│   │   ├── remark-custom-container.ts  # Remark 插件：自定义容器指令
│   │   └── rehype-custom-container.ts  # Rehype 插件：自定义容器样式
│   └── styles/
│       └── global.css          # 全局样式（暗色模式变量、代码块、动画、彩蛋）
├── astro.config.mjs            # Astro 配置
├── tailwind.config.mjs         # Tailwind CSS v4 配置
├── tsconfig.json               # TypeScript 配置
└── package.json
```

## 内容加密

所有博客、随笔和项目文件均使用 **AES-256-GCM** 加密存储为 `.md.enc` 格式。


### 加解密命令

```bash
# 加密所有 .md 文件为 .md.enc
node scripts/encrypt.mjs

# 解密所有 .md.enc 文件为 .md
node scripts/encrypt.mjs --decrypt

# 预览加密变更（不写入）
node scripts/encrypt.mjs --dry

# 加密/解密单个文件
node scripts/encrypt.mjs path/to/file.md
node scripts/encrypt.mjs --decrypt path/to/file.md.enc
```

## 本地开发

```bash
# 安装依赖
npm install

# 设置加密密钥（确保能解密内容）
export CONTENT_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# 启动开发服务器
npm run dev

# 构建生产版本（含 Pagefind 搜索索引）
npm run build

# 预览构建结果
npm run preview
```

## 脚本工具

### 创建内容

提供交互式和非交互式两种模式：

```bash
# 交互式创建博客
npm run create:post

# 交互式创建随笔
npm run create:note

# 非交互式创建
node scripts/create.mjs blog "文章标题" -d "描述" -t "标签1,标签2" -s "系列名"
node scripts/create.mjs note "标题" -d "描述" -t "标签1,标签2"
```

创建后若 `CONTENT_KEY` 已设置，会自动加密为 `.md.enc`。

### 中文文本规范化

自动为中英文之间加空格、统一中文语境下的全角标点：

```bash
# 规范化单个文件
npm run normalize src/content/note/20260509.md

# 规范化所有 content 文件
npm run normalize:all

# 预览变更
npm run normalize:all --dry
```

## Markdown 特性

### 自定义容器

使用 `remark-directive` 实现提示框语法：

```markdown
:::note
这是一条笔记
:::

:::warning
这是一条警告
:::

:::tip
这是一个提示
:::

:::danger
这是一个危险警告
:::

:::info
这是一条信息
:::

:::caution
请注意
:::
```

支持 6 种类型：`note`（蓝色）、`warning`（黄色）、`tip`（绿色）、`danger`（红色）、`info`（靛蓝）、`caution`（紫色）。

### 代码高亮

使用 [Shiki](https://shiki.style) 的 GitHub Dark 主题，支持：

- **行号**: 自动添加行号
- **高亮行**: `// [!code highlight]`
- **聚焦行**: `// [!code focus]`
- **差异行**: `// [!code ++]` / `// [!code --]`
- **代码块标题**: 配合 `rehype-code-title` 插件
- **复制按钮**: 鼠标悬停显示复制按钮

## 交互功能

### 暗色模式
- 自动检测系统偏好（`prefers-color-scheme`）
- 手动切换并持久化到 `localStorage`
- 使用 `prevent flash` 脚本避免闪烁


### 全文搜索
基于 [Pagefind](https://pagefind.app)，构建时生成搜索索引，支持模糊搜索和子结果展示。

### 移动端抽屉菜单
右侧滑入式菜单，文章页面自动同步目录（TOC）。

### 系列文章导航
博客支持 `series` 字段分组，文章详情页底部显示系列内的上一篇/下一篇导航。

## 部署

推送至 `main` 分支将自动触发 GitHub Actions 工作流，构建并部署到 GitHub Pages。

> ⚠️ 部署时需在 GitHub Actions Secrets 中设置 `CONTENT_KEY` 环境变量。

## 许可证

MIT © fffg
