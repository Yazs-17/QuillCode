# Common Module - 通用工具模块

> 🛠️ NestJS 通用工具集：错误处理、响应格式化、业务异常

## 📁 目录结构

```
common-module/
├── src-backend/            # 后端源码 (带详细注释)
│   ├── constants/          # 错误码定义
│   ├── exceptions/         # 业务异常类
│   ├── filters/            # 异常过滤器
│   ├── interceptors/       # 响应拦截器
│   └── index.ts            # 统一导出
└── README.md
```

## 🚀 功能特性

- ✅ 统一错误码定义
- ✅ 业务异常类（带静态工厂方法）
- ✅ HTTP 异常过滤器（统一错误响应格式）
- ✅ 响应转换拦截器（统一成功响应格式）

## 📦 集成到你的项目

```bash
# 复制源码
cp -r common-module/src-backend/* your-project/src/common/
```

```typescript
// main.ts
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  
  await app.listen(3000);
}
```

## 📤 统一响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "Success",
  "data": { "id": "123", "name": "test" },
  "timestamp": 1704067200000
}
```

### 错误响应

```json
{
  "code": 1001,
  "message": "Authentication failed",
  "data": null,
  "timestamp": 1704067200000
}
```

## 🔢 错误码规范

| 范围 | 类型 | 示例 |
|------|------|------|
| 0 | 成功 | SUCCESS |
| 1xxx | 认证错误 | AUTH_FAILED, TOKEN_EXPIRED |
| 2xxx | 资源错误 | ARTICLE_NOT_FOUND |
| 3xxx | 执行错误 | EXEC_TIMEOUT |
| 9xxx | 系统错误 | INTERNAL_ERROR |

## 🔧 使用业务异常

```typescript
import { BusinessException } from './common/exceptions/business.exception';

// 方式1：使用静态工厂方法
throw BusinessException.authFailed('Token 已过期');

// 方式2：使用错误码
throw new BusinessException(ErrorCode.USER_EXISTS, '用户已存在');
```
