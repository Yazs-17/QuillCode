# Backend Dockerfile - NestJS Application (Alpine Optimized)
# 支持 SQLite 轻量化部署，移除 MySQL/ElasticSearch 重型依赖

FROM node:20-alpine AS builder

WORKDIR /app

# 安装构建 better-sqlite3 所需的原生依赖
RUN apk add --no-cache python3 make g++ sqlite-dev

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段 - 最小化镜像
FROM node:20-alpine AS production

WORKDIR /app

# 安装运行时依赖（better-sqlite3 需要）
RUN apk add --no-cache sqlite-libs

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 创建数据目录
RUN mkdir -p /app/data && chown -R nestjs:nodejs /app/data

# 复制 package 文件
COPY package*.json ./

# 安装构建工具并编译原生模块，然后清理
RUN apk add --no-cache --virtual .build-deps python3 make g++ sqlite-dev && \
    npm ci --only=production && \
    apk del .build-deps

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 复制 SQLite 初始化脚本
COPY database/sqlite-init.sql ./database/

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_TYPE=sqlite
ENV DB_DATABASE=/app/data/quillcode.db

# 切换到非 root 用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "dist/main"]
