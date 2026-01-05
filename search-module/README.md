# Search Module - Elasticsearch 搜索模块

> 🔍 NestJS + Elasticsearch 全文搜索解决方案

## 📁 目录结构

```
search-module/
├── demo/                    # ⭐ 可直接运行的完整示例
│   ├── backend/            # NestJS 后端
│   └── frontend/           # Vue 3 搜索界面
├── src-backend/            # 后端源码 (带详细注释)
└── README.md
```

## 🚀 快速体验

### 前置条件

需要运行 Elasticsearch：
```bash
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

### 启动 Demo

```bash
cd search-module/demo/backend
npm install
npm run start:dev
```

## 🛠️ 功能特性

- ✅ Elasticsearch 全文搜索
- ✅ 搜索结果高亮
- ✅ 自动索引管理
- ✅ 优雅降级（ES 不可用时返回空结果）

## 🔑 API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /search?q=keyword | 搜索 |
| GET | /search/status | ES 状态 |

## 📦 集成到你的项目

```bash
npm install @elastic/elasticsearch
```

```typescript
// app.module.ts
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [SearchModule],
})
export class AppModule {}
```

## 🔧 环境变量

```env
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=articles
```
