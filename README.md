# 分支概述

> 本分支（`on-prem`）主要用于完全本地化部署的方案，将来将会与 desktop-app 合并，并整理 native 方案。

## 项目启动指南

本项目提供了两种启动方式：**一键 Docker 部署**（推荐）和 **本地开发环境启动**（适用于开发者）。

### 方式一：一键部署 (Docker 一步到位)

前置条件：确保您的电脑上已安装并启动了 `Docker` 和 `Docker Compose`。

1. 在项目根目录，打开终端或命令行。
2. 运行以下命令启动所有服务（包括数据库、Elasticsearch、Ollama 以及前后端服务）：

```bash
docker-compose up -d
```

3. 等待容器启动完成。服务启动后可以通过以下地址访问：
   - 网页前端：`http://localhost:80` (或配置的网络端口)
   - 后端 API：`http://localhost:3000`

若需停止服务，请执行：`docker-compose down`

### 方式二：本地开发环境启动

前置环境准备：Node.js >= 18, `pnpm` 包管理器，以及配套的 MySQL 和 Elasticsearch 环境（可以通过单启 `docker-compose.yml` 中的基础设施）。

如需单独启动基础设施，可以运行：
```bash
docker-compose up -d mysql elasticsearch ollama
```

#### 1. 启动后端 (NestJS)

打开一个新的终端窗口：

```bash
cd backend
# 安装依赖
pnpm install
# 启动开发服务器
pnpm run start:dev
```

后端服务将运行在 `http://localhost:3000`。

#### 2. 启动前端 (Vue 3 + Vite)

打开另一个终端窗口：

```bash
cd frontend
# 安装依赖
pnpm install
# 启动前端页面
pnpm run dev
```

前端应用: `http://localhost/login`。