# Poly Pulse

## 项目简介

Poly Pulse 是一个 Polymarket 市场看板项目，包含：

- **frontend**：基于 React + Vite 的前端界面
- **backend**：基于 Express + TypeScript 的后端服务

目前后端已经直接集成了 Polymarket 数据抓取与统一市场模型转换逻辑，**不再依赖本地 `pmxt` 项目或额外服务**，拉代码后可直接启动。

## 项目结构

```text
poly-pulse/
├── frontend/
└── backend/
```

## 启动方式

### 1. 启动后端

```bash
cd backend
npm install
npm run dev
PORT=3939 npm run dev
```

默认端口：`3939`

如果你需要环境变量，可以参考：

```bash
cp .env.example .env
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端通常会由 Vite 启动在本地开发端口，比如：`5173`

## 构建

### 后端构建

```bash
cd backend
npm run build
```

### 前端构建

```bash
cd frontend
npm run build
```

## 20260606进度

- **前端当前程度**
  - 已完成市场列表展示、筛选、搜索、统计概览和详情弹窗等基础看板能力
  - 已适配后端返回的统一市场数据结构，可正常展示真实 Polymarket 市场数据

- **后端当前程度**
  - 已完成 Polymarket 市场数据获取、统一数据转换、缓存、分类和热门市场等接口能力
  - 已去除对本地 `pmxt-core` 的依赖，后端可以独立启动并直接请求 Polymarket 公开数据源

- **完成后端 PMXT 集成内置化**
  - 将原本依赖本地 `pmxt-core` 的实现，改为直接把所需 Polymarket 核心逻辑集成到当前项目中
  - 新增了 `backend/src/lib/pmxt/` 目录，包含 fetcher、normalizer、error mapper、types 等核心代码

- **完成接口验证**
  - 已验证后端 `api/markets` 可正常返回真实市场数据
  - 项目当前可以直接本地启动并运行