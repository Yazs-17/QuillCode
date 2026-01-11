[TOC]

## 项目概述

QuillCode 是一个面向程序员的在线代码笔记系统，旨在提供一个"随写、随存、随运行"的代码学习与管理环境。系统支持 Markdown 文档编写、多语言代码编辑与在线执行、标签分类管理、智能文章关联与推荐、文章分享与评论等功能。

"Quill" 一词源自英文中的"羽毛笔"，象征着书写与创作。在 QuillCode 中，每一篇代码笔记都被称为一个 "Quill"，寓意用户用代码书写自己的技术成长之路。

## 部署模式

QuillCode 支持多种部署模式，满足不同场景需求：

| 模式 | 数据库 | 搜索引擎 | AI 功能 | 适用场景 |
|------|--------|----------|---------|----------|
| **Lite Mode** | SQLite | SQLite FTS5 | BYOK (自带 API Key) | 个人使用、低配服务器 |
| **AI Mode** | SQLite | SQLite FTS5 | 本地 Ollama | 需要本地 AI 的场景 |
| **Full Mode** | MySQL | ElasticSearch | Ollama | 企业级部署 |

## 快速开始

### 方式一：Lite Mode（推荐个人使用）

最轻量的部署方式，仅需 SQLite，无需安装 MySQL 或 ElasticSearch。

```bash
# 克隆项目
git clone https://github.com/your-repo/quillcode.git
cd quillcode

# 启动 Lite 模式
docker-compose -f docker-compose.lite.yml up -d

# 查看日志
docker-compose -f docker-compose.lite.yml logs -f
```

访问 http://localhost 即可使用。

### 方式二：AI-Enhanced Mode（带本地 AI）

包含本地 Ollama AI 服务，支持代码解释、智能补全等 AI 功能。

**有 NVIDIA GPU：**
```bash
# 启动 AI 模式（GPU 加速）
docker-compose -f docker-compose.ai.yml up -d

# 拉取 AI 模型（首次启动需要）
./scripts/pull-ollama-model.sh
```

**无 GPU（CPU 模式）：**
```bash
# 启动 AI 模式（CPU）
docker-compose -f docker-compose.ai-cpu.yml up -d

# 拉取 AI 模型
./scripts/pull-ollama-model.sh
```

### 方式三：Full Mode（企业级）

完整功能部署，包含 MySQL + ElasticSearch + Ollama。

```bash
# 启动完整模式
docker-compose up -d
```

## 环境变量配置

创建 `.env` 文件自定义配置：

```bash
# JWT 密钥（生产环境必须修改）
JWT_SECRET=your-super-secret-key-here

# Ollama 模型选择
OLLAMA_MODEL=llama3:8b

# 数据库路径（Lite/AI 模式）
DB_DATABASE=/app/data/quillcode.db
```

## Ollama 模型管理

### 拉取推荐模型

```bash
# 使用脚本自动拉取
./scripts/pull-ollama-model.sh

# 或手动拉取
docker exec -it quillcode-ollama ollama pull llama3:8b
```

### 可选模型

| 模型 | 大小 | 说明 |
|------|------|------|
| `llama3:8b` | ~4.7GB | 推荐，平衡性能与资源 |
| `llama3:70b` | ~40GB | 更强能力，需要大内存 |
| `codellama:7b` | ~3.8GB | 代码专用模型 |
| `qwen2:7b` | ~4.4GB | 中文支持更好 |

修改模型：
```bash
# 在 .env 文件中设置
OLLAMA_MODEL=codellama:7b

# 重启服务
docker-compose -f docker-compose.ai.yml restart backend
```

## 数据持久化

### SQLite 数据位置

Lite/AI 模式下，数据存储在 Docker Volume 中：

```bash
# 查看数据卷
docker volume inspect quillcode_quillcode_data

# 备份数据
docker cp quillcode-backend:/app/data/quillcode.db ./backup/
```

### 数据导出

在 Web 界面中，点击设置 → 导出数据，支持：
- JSON 格式（完整元数据）
- Markdown ZIP（每篇笔记一个文件）

## 常见问题

### Q: 如何从 Lite 模式迁移到 AI 模式？

```bash
# 1. 停止 Lite 模式
docker-compose -f docker-compose.lite.yml down

# 2. 启动 AI 模式（数据卷会自动保留）
docker-compose -f docker-compose.ai.yml up -d
```

### Q: Ollama 模型下载很慢？

可以使用镜像加速或手动下载：
```bash
# 设置代理
docker exec -it quillcode-ollama sh -c "export HTTPS_PROXY=http://your-proxy:port && ollama pull llama3:8b"
```

### Q: 如何查看服务状态？

```bash
# 查看所有服务状态
docker-compose -f docker-compose.lite.yml ps

# 查看后端日志
docker logs quillcode-backend -f

# 健康检查
curl http://localhost:3000/health
```

## Functions

1. 未来功能前瞻：
   - 文件上传（包含教程markdown file、standard code file），markdown file 实时渲染
   - add console 调试功能
   - AI语义知识库加入，AI智能筛选
   - 管理后台重做并独立出来
   - 强化AI推荐，优化es检索（考虑加入AI推荐流）
   - Github发布形式
     - 源码开源
     - QuillCode 更加倾向于在线试用，对试用者（需要登录注册）可以下载软件（跳转到github releases 页面下载），开源软件，是一款 electron 软件
     - 这里需要加入对CI/CD的实践
   
2. 阶段性任务
   - 宣传一下自己做的小玩具

## Some Tools

Vue (frontend) & Nest.js (backend) & TypeORM

## 开发环境

### 本地开发

```bash
# 后端
cd backend
pnpm install
pnpm run start:dev

# 前端
cd frontend
pnpm install
pnpm dev
```

### 技术栈

- **前端**: Vue 3 + Vite + Pinia
- **后端**: NestJS + TypeORM
- **数据库**: SQLite (Lite/AI) / MySQL (Full)
- **搜索**: SQLite FTS5 (Lite/AI) / ElasticSearch (Full)
- **AI**: Ollama / BYOK (OpenAI 兼容 API)

## 传统部署方式

如果不使用 Docker，可以手动部署：

1. Node.js 20.x
2. 数据库选择：
   - **Lite 模式**: 无需额外安装，使用 SQLite
   - **Full 模式**: MySQL 8.0 + ElasticSearch 8.x
3. AI 服务（可选）: Ollama

详细步骤参考 [传统部署文档](./docs/manual-deploy.md)

## License

MIT
