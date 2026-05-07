---
title: '从零开始搭建 GitHub Actions CI/CD'
description: '本文将手把手教你如何为项目配置 GitHub Actions，实现自动化测试和部署。'
date: '2026-04-10'
---

GitHub Actions 是 GitHub 提供的 CI/CD 服务，可以自动化你的软件开发工作流。

## 什么是 GitHub Actions

GitHub Actions 让你直接在 GitHub 仓库中自动化、自定义和执行软件开发工作流。

## 基础概念

- **Workflow**: 可配置的自动化过程
- **Job**: 工作流中的一组步骤
- **Step**: 单个任务
- **Action**: 可复用的命令

## 示例配置

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
```
