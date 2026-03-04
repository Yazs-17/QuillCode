# QuillCode - Local Branch

由于 MySQL 与 Elasticsearch 的架构对本地化部署存在过度设计，本分支(@on-prem)采用 SQLite 与 SQLite FTS5 进行了数据存储及搜索功能的重构，去除了多余的外部运行依赖。

## 启动指南

本项目支持基于 Docker Compose 的容器化一键部署，或拆分前后端的本地独立开发模式。

### 方式一：Docker 容器化部署（推荐）

需确保系统已正确安装 Docker 与 Docker Compose。

1. 在项目根目录执行以下命令，以后台模式构建并启动服务：

```bash
docker-compose up -d --build
```

2. 容器启动完成后，各项服务映射的本地端口如下：
- 前端交互界面：http://localhost:8080
- 后端 API 服务：http://localhost:3001
- Ollama AI 服务：http://localhost:11434

3. 停止并释放容器环境：

```bash
docker-compose down
```

### 方式二：本地开发模式

需确保系统已安装 Node.js 及 pnpm 包管理器。

#### 后端服务 (NestJS)

打开终端执行以下命令：

```bash
cd backend
pnpm install
pnpm run start:dev
```

后端服务默认监听 3000 端口。

#### 前端服务 (Vue + Vite)

新开终端并执行以下命令：

```bash
cd frontend
pnpm install
pnpm run dev
```

