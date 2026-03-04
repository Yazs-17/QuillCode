# Backend Dockerfile - NestJS Application
FROM node:20-slim AS builder

WORKDIR /app

# 复制package文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-slim AS production

WORKDIR /app

# 复制package文件
COPY package.json package-lock.json* ./

# 只安装生产依赖，触发 sqlite3 二进制模块重建
RUN npm install --omit=dev

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]
