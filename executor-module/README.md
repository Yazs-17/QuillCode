# Executor Module - 代码执行模块

> ⚡ 安全的在线代码执行引擎，支持沙箱和 Docker 两种模式

## 📁 目录结构

```
executor-module/
├── demo/                    # ⭐ 可直接运行的完整示例
│   ├── backend/            # NestJS 后端 (端口 3000)
│   └── frontend/           # Vue 3 前端代码编辑器
├── src-backend/            # 后端源码 (带详细注释)
│   ├── dto/                # 数据传输对象
│   ├── executors/          # 执行器实现
│   └── *.ts                # 服务、控制器、模块
├── src-frontend/           # 前端源码
│   ├── services/           # API 服务封装
│   └── components/         # 代码编辑器组件
└── README.md
```

## 🚀 快速体验 Demo

### 启动后端

```bash
cd executor-module/demo/backend
npm install
npm run start:dev
# 后端运行在 http://localhost:3000
```

### 启动前端

```bash
cd executor-module/demo/frontend
npm install
npm run dev
# 前端运行在 http://localhost:5173
```

## 🛠️ 支持的语言

| 语言 | 沙箱模式 | Docker 模式 | 说明 |
|------|----------|-------------|------|
| JavaScript | ✅ | ✅ | 无需 Docker |
| TypeScript | ✅ | ✅ | 无需 Docker |
| Python | ❌ | ✅ | 需要 Docker |
| Java | ❌ | ✅ | 需要 Docker |

## 🔒 安全特性

- **沙箱隔离**：禁用 `require`, `fetch`, `setTimeout` 等危险 API
- **Docker 隔离**：网络隔离、内存限制 (128MB)、CPU 限制 (50%)
- **执行超时**：默认 10 秒超时
- **自动清理**：执行完成后自动删除容器

## 🔑 API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /executor/run | 执行代码 |
| GET | /executor/info | 获取支持的语言 |

### 请求示例

```bash
curl -X POST http://localhost:3000/executor/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log(\"Hello World\")",
    "language": "javascript"
  }'
```

### 响应示例

```json
{
  "success": true,
  "output": "Hello World",
  "error": null,
  "executionTime": 15,
  "logs": [
    { "type": "log", "text": "Hello World", "timestamp": 1704067200000 }
  ]
}
```
