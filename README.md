# fffg 个人网站

基于 Astro + Tailwind CSS 构建的个人网站，部署于 GitHub Pages。

## 技术栈

- **框架**: [Astro](https://astro.build)
- **样式**: [Tailwind CSS](https://tailwindcss.com)
- **部署**: [GitHub Pages](https://pages.github.com)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)

## 项目结构

```
src/
├── components/       # UI 组件
│   ├── Hero.astro
│   ├── FeaturedProjects.astro
│   ├── FeaturedPosts.astro
│   └── Contact.astro
├── layouts/          # 布局模板
│   └── Layout.astro
├── pages/            # 页面路由
│   ├── index.astro   # 首页
│   ├── blog.astro    # 文章列表
│   └── projects.astro # 项目页
└── styles/
    └── global.css    # 全局样式
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署

推送至 `main` 分支将自动触发 GitHub Actions 构建并部署到 GitHub Pages。
