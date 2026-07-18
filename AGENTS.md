# AGENTS.md

## 项目概述

这是一个个人的 **scratch 工作区**（草稿/实验场），用于存放日常零碎代码、博客示例和技术实验。博客地址：https://www.cnblogs.com/wozho/

## 项目结构

**pnpm monorepo**，使用 `pnpm-workspace.yaml` 管理多个子包。

### 子包

| 包名 | 说明 |
|---|---|
| `base` (`@woz-scratch/base`) | 通用基础工具库，可被其他包依赖（如 jest 包已引用） |
| `web` | 前端实验：React 18 + Vite + TailwindCSS，含 Monaco Editor、xterm 等 |
| `nodejs` | Node.js 服务端示例：Koa、gulp 等 |
| `native` | Native 原生模块实验（ffi-napi、iconv-lite） |
| `webpack` | Webpack 配置与实践 |
| `jest` | Jest 测试配置与示例，依赖 `@woz-scratch/base` |
| `trpc` | tRPC + Express + Zod 实验，含 pkg 打包 |
| `dns` | DNS 相关实验 |
| `ldap` | LDAP 相关实验 |
| `crypto` | 加密相关示例（AES 等） |
| `sourceMap` | Source Map 研究 |
| `webshell` | WebShell（Express + node-pty + WebSocket） |
| `packages/*` | 额外子包目录 |

### 非包目录

- `skill/` — 浏览器、IDEA、Postman 等技巧笔记
- `posts/` — 博客文章草稿
- `snippet/` — 代码片段
- `lib/` — 工具和库参考文档
- `canvas/` — Canvas 相关实验
- `docker/` — Docker 相关配置
- `jenkins/` — Jenkins 相关

## 技术栈

- **语言**：TypeScript / JavaScript（主流），少量 Python、Rust
- **包管理**：pnpm（monorepo workspaces）
- **前端**：React 18、Vite、TailwindCSS、Less、jQuery、Monaco Editor
- **后端**：Express 5、Koa、tRPC
- **测试**：Jest 29 + Babel
- **构建**：TypeScript `tsc`、esbuild、Webpack、Vite
- **格式化**：Prettier
- **运行时**：Node.js >= 18，ESM modules（`"type": "module"`）

## 编码规范

- **Prettier 配置**：`printWidth: 120`、`semi: true`、`singleQuote: true`、`tabWidth: 2`、`trailingComma: 'none'`
- 新建子包优先使用 ESM（`"type": "module"`）
- 共享代码放 `base` 包，通过 workspace 协议引用：`"@woz-scratch/base": "workspace:^"`
- 每个子包有独立的 `package.json` 和自己的构建/运行脚本

## 常用命令

```bash
# 安装依赖
pnpm install

# 运行指定子包的脚本
pnpm --filter @woz-scratch/base run build
pnpm --filter trpc run server
pnpm --filter web run vite:dev
pnpm --filter jest run test

# 格式化
npx prettier --write .
```

## 注意事项

- 这是一个实验性仓库，各子包之间相对独立，改动通常只涉及单个子包
- `pnpm-lock.yaml` 已在 `.gitignore` 中，不纳入版本控制
- 没有根级 `tsconfig.json`，各子包自行管理 TypeScript 配置
- `base` 包是唯一被其他包依赖的共享包，修改时注意影响范围
