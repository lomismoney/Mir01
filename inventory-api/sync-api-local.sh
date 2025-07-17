#!/bin/bash

# 本地環境的 API 契約同步腳本
# 使用環境變數控制，避免產生測試數據

echo "🔄 開始本地 API 契約同步..."

# 先確保 config 已經清理
./vendor/bin/sail artisan config:clear

# 設定環境變數並生成 API 文檔
SCRIBE_USE_FACTORY=false ./vendor/bin/sail artisan scribe:generate

# 複製到前端
cp storage/app/scribe/openapi.yaml ../inventory-client/openapi.yaml

echo "✅ API 文檔生成完成"

# 生成前端類型
cd ../inventory-client
npm run api:types

echo "✅ 前端類型生成完成"
echo "🎉 本地契約同步完成！"