# Next.js 14 前端 Dockerfile (多階段構建生產環境)

# Stage 1: 依賴安裝階段
FROM node:20-alpine AS deps
WORKDIR /app

# 僅複製 package 文件以利用 Docker 層緩存
COPY package.json package-lock.json* ./
# 安裝依賴
RUN npm ci --only=production && npm cache clean --force

# Stage 2: 構建階段
FROM node:20-alpine AS builder
WORKDIR /app

# 接受構建時參數
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# 複製依賴
COPY --from=deps /app/node_modules ./node_modules
# 複製源代碼
COPY . .

# 安裝所有依賴（包括 devDependencies）用於構建
RUN npm ci

# 生成 API 類型
RUN npm run api:types

# 構建應用
RUN npm run build

# Stage 3: 運行階段 - 最小化生產環境
FROM node:20-alpine AS runner
WORKDIR /app

# 設定環境變數
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 創建非 root 用戶以增強安全性
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 只複製生產環境需要的文件
# Next.js 自動創建的獨立輸出包含運行時所需的最少文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 創建必要目錄並設定權限
RUN mkdir -p /app/.next/cache \
    && chown -R nextjs:nodejs /app/.next/cache

# 切換到非 root 用戶
USER nextjs

# 暴露端口
EXPOSE 3000

# 設定 Cloud Run 環境變數
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 啟動應用（使用 Next.js 獨立模式的 server.js）
CMD ["node", "server.js"]
 