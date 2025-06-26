#!/bin/bash

# =============================================
# API 文檔重新生成腳本
# 
# 功能：
# 1. 生成 Scribe API 文檔
# 2. 複製到前端項目
# 3. 生成 TypeScript 類型定義
# =============================================

echo "🔄 開始重新生成 API 文檔..."

# 步驟 1: 生成 Scribe 文檔
echo "📝 生成 Scribe 文檔..."
php artisan scribe:generate

# 修復非標準的 OpenAPI 類型
# 注意：這只是為了處理遺留代碼中的 date/datetime/numeric 類型
# 新代碼應該使用標準的 string/number 類型，避免需要此修復步驟
php fix-openapi-types.php

# 檢查是否成功
if [ $? -ne 0 ]; then
    echo "❌ Scribe 文檔生成失敗"
    exit 1
fi

# 步驟 2: 複製到前端
echo "📋 複製 OpenAPI 文檔到前端..."
cp storage/app/private/scribe/openapi.yaml ../inventory-client/openapi.yaml

# 檢查是否成功
if [ $? -ne 0 ]; then
    echo "❌ 複製 OpenAPI 文檔失敗"
    exit 1
fi

# 步驟 3: 生成 TypeScript 類型
echo "🚀 生成 TypeScript 類型定義..."
cd ../inventory-client && npm run api:types

# 檢查是否成功
if [ $? -ne 0 ]; then
    echo "❌ TypeScript 類型生成失敗"
    exit 1
fi

echo "✅ API 文檔和類型定義已成功更新！"
echo ""
echo "下一步："
echo "1. 檢查前端是否有編譯錯誤：npm run build"
echo "2. 提交變更到版本控制" 