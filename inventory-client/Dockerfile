# Next.js 14 前端 Dockerfile
# 分階段構建以優化映像大小

# 階段 1: 依賴安裝
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 複製 package 檔案
COPY package.json package-lock.json* ./

# 安裝依賴
RUN npm ci

# 階段 2: 構建應用程式
FROM node:20-alpine AS builder
WORKDIR /app

# 安裝 curl 來下載 OpenAPI 規格
RUN apk add --no-cache curl

# 複製依賴
COPY --from=deps /app/node_modules ./node_modules

# 複製應用程式代碼
COPY . .

# 設定環境變數
ENV NEXT_TELEMETRY_DISABLED 1

# 設定建置時 API URL 參數（用於 GCP 部署）
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# 生成 TypeScript API 類型
# 注意：在 Cloud Run 環境中，OpenAPI 檔案會通過 GCS 掛載共享
RUN if [ -f "openapi.yaml" ]; then \
      echo "✅ 找到 openapi.yaml，生成 TypeScript API 類型..." && \
      npm run api:types && \
      echo "✅ API 類型生成完成"; \
    else \
      echo "⚠️ 找不到 openapi.yaml，建立基本類型檔案..." && \
      mkdir -p src/types && \
      echo "// Auto-generated API types (fallback)" > src/types/api.ts && \
      echo "export interface paths {" >> src/types/api.ts && \
      echo "  '/api/auth/login': any;" >> src/types/api.ts && \
      echo "  '/api/auth/logout': any;" >> src/types/api.ts && \
      echo "  '/api/auth/user': any;" >> src/types/api.ts && \
      echo "}" >> src/types/api.ts && \
      echo "export interface components {" >> src/types/api.ts && \
      echo "  schemas: {};" >> src/types/api.ts && \
      echo "}" >> src/types/api.ts; \
    fi

# 構建應用程式
RUN npm run build

# 階段 3: 運行環境
FROM node:20-alpine AS runner
WORKDIR /app

# 設定環境變數
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 創建非 root 用戶
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製必要檔案
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# 複製構建產物並設定權限
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切換到非 root 用戶
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 啟動應用程式
CMD ["node", "server.js"] 