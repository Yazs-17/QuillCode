# Auth Module - JWT 认证模块

> 🔐 NestJS + Vue 3 的完整 JWT 认证解决方案，开箱即用

## 📁 目录结构

```
auth-module/
├── demo/                    # ⭐ 可直接运行的完整示例
│   ├── backend/            # NestJS 后端 (端口 3000)
│   └── frontend/           # Vue 3 前端 (端口 5173)
├── src-backend/            # 后端源码 (带详细注释)
│   ├── entities/           # 数据库实体
│   ├── dto/                # 数据传输对象
│   ├── strategies/         # Passport 策略
│   ├── guards/             # 路由守卫
│   └── *.ts                # 服务、控制器、模块
├── src-frontend/           # 前端源码 (带详细注释)
│   ├── services/           # API 服务封装
│   └── components/         # Vue 组件
└── README.md
```

## 🚀 快速体验 Demo (5分钟)

### 1️⃣ 启动后端

```bash
cd auth-module/demo/backend
npm install
npm run start:dev
```

看到以下输出表示成功：
```
╔════════════════════════════════════════════╗
║     Auth Module Demo - Backend Started     ║
║  🚀 Server: http://localhost:3000          ║
╚════════════════════════════════════════════╝
```

### 2️⃣ 启动前端

```bash
cd auth-module/demo/frontend
npm install
npm run dev
```

打开浏览器访问 http://localhost:5173

### 3️⃣ 测试功能

1. 注册一个新用户
2. 使用注册的账号登录
3. 查看用户信息和 JWT Token

## 🛠️ 技术栈

| 端 | 框架 | 语言 | 说明 |
|---|------|------|------|
| 后端 | NestJS 10 | TypeScript | 企业级 Node.js 框架 |
| 前端 | Vue 3 + Vite | JavaScript | 现代前端框架 |
| 数据库 | SQLite | - | Demo 用，生产可换 MySQL |
| 认证 | JWT + Passport | - | 业界标准方案 |

## 📦 集成到你的项目

### 后端集成 (NestJS)

```bash
# 1. 安装依赖
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
npm install -D @types/passport-jwt @types/bcrypt

# 2. 复制源码
cp -r auth-module/src-backend/* your-project/src/modules/auth/

# 3. 在 app.module.ts 中导入
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
```

### 前端集成 (Vue 3)

```bash
# 1. 复制服务文件
cp auth-module/src-frontend/services/auth.service.js your-project/src/services/

# 2. 复制组件（可选）
cp -r auth-module/src-frontend/components/* your-project/src/components/auth/

# 3. 修改 API 地址
# 编辑 auth.service.js 中的 API_BASE_URL
```

## 🔑 API 接口

| 方法 | 路径 | 描述 | 认证 | 请求体 |
|------|------|------|------|--------|
| POST | /auth/register | 用户注册 | ❌ | `{username, email, password}` |
| POST | /auth/login | 用户登录 | ❌ | `{username, password}` |
| GET | /auth/profile | 获取用户信息 | ✅ | - |

### cURL 测试示例

```bash
# 注册
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456"}'

# 登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 获取用户信息（需要 token）
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 自定义扩展

查看源码中的 `🔧` 注释，了解如何：
- 添加更多用户字段（头像、手机号等）
- 实现密码重置功能
- 添加 OAuth 第三方登录
- 实现 Token 刷新机制
