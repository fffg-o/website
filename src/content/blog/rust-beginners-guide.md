---
title: 'Rust 入门指南：从零开始'
description: 'Rust 是一门系统级编程语言，以其安全性和性能著称。本文适合零基础读者入门。'
date: '2026-03-28'
---

Rust 是一门系统编程语言，专注于安全、并发和性能。

## 为什么学习 Rust

Rust 的所有权系统保证了内存安全，无需垃圾回收器。

## 安装 Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Hello, World!

```rust
fn main() {
    println!("Hello, World!");
}
```

## 所有权系统

Rust 的所有权规则：
1. 每个值都有一个所有者
2. 同一时间只能有一个所有者
3. 当所有者离开作用域，值将被丢弃
