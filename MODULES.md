# 可复用模块

从 QuillCode 项目中提取的独立功能模块，每个模块都包含：
- ⭐ **demo/** - 可直接运行的完整示例
- 📦 **src-backend/** - 后端源码（NestJS/TypeScript，带详细注释）
- 🎨 **src-frontend/** - 前端源码（Vue 3/JavaScript，带详细注释）

## 模块列表

| 模块 | 描述 | 后端 | 前端 |
|------|------|------|------|
| [auth-module](./auth-module) | JWT 认证（注册/登录/验证） | NestJS | Vue 3 |
| [executor-module](./executor-module) | 代码执行（沙箱/Docker） | NestJS | Vue 3 |
| [search-module](./search-module) | Elasticsearch 全文搜索 | NestJS | - |
| [common-module](./common-module) | 通用工具（错误处理/拦截器） | NestJS | - |

## 🚀 快速体验

每个模块都有独立的 demo，可以直接运行：

```bash
# 以 auth-module 为例
cd auth-module/demo/backend
npm install
npm run start:dev

# 新开终端
cd auth-module/demo/frontend
npm install
npm run dev
```

## 📁 统一目录结构

```
xxx-module/
├── demo/                    # ⭐ 可直接运行的 Demo
│   ├── backend/            # 后端 Demo (NestJS)
│   └── frontend/           # 前端 Demo (Vue 3)
├── src-backend/            # 📦 后端源码（带详细注释）
├── src-frontend/           # 🎨 前端源码（带详细注释）
└── README.md               # 📖 使用说明
```

## 🔧 集成指南

1. 查看模块的 README.md 了解功能和 API
2. 运行 demo 体验功能
3. 复制 src-backend 或 src-frontend 到你的项目
4. 根据注释中的 🔧 标记进行自定义

## 📝 代码注释规范

所有源码都包含详细注释：
- `📌` - 功能说明
- `🔧` - 自定义指南
- `🔒` - 安全相关
- `⚠️` - 注意事项
