#!/bin/bash

# 庫存管理系統 GCP 部署前準備腳本
# 此腳本將安裝必要的依賴並檢查配置

set -e

echo "🚀 開始準備 GCP 部署環境..."

# 檢查當前目錄是否為專案根目錄
if [ ! -f "inventory-api/composer.json" ] || [ ! -f "inventory-client/package.json" ]; then
    echo "❌ 錯誤：請在專案根目錄執行此腳本"
    exit 1
fi

echo "✅ 專案結構檢查通過"

# 安裝後端 Google Cloud Storage 依賴
echo "📦 安裝後端 Google Cloud Storage 依賴..."
cd inventory-api

# 檢查是否已安裝 Google Cloud Storage 相關套件
if composer show google/cloud-storage &>/dev/null; then
    echo "✅ Google Cloud Storage 套件已安裝"
else
    echo "📦 安裝 Google Cloud Storage 官方套件..."
    composer require google/cloud-storage
    echo "✅ Google Cloud Storage 套件安裝完成"
fi

# 檢查是否已安裝 Flysystem Google Cloud Storage 適配器
if composer show league/flysystem-google-cloud-storage &>/dev/null; then
    echo "✅ Flysystem GCS 適配器已安裝"
else
    echo "📦 安裝 Flysystem Google Cloud Storage 適配器..."
    composer require league/flysystem-google-cloud-storage
    echo "✅ Flysystem GCS 適配器安裝完成"
fi

echo "✅ 後端依賴安裝完成"

# 回到專案根目錄
cd ..

# 檢查前端 Next.js 配置
echo "🔍 檢查前端配置..."
if [ -f "inventory-client/src/lib/apiClient.ts" ]; then
    echo "✅ 前端 API 客戶端配置存在"
else
    echo "❌ 警告：前端 API 客戶端配置不存在"
fi

# 檢查 Dockerfile 配置
echo "🔍 檢查 Dockerfile 配置..."
if grep -q "ARG NEXT_PUBLIC_API_BASE_URL" inventory-client/Dockerfile; then
    echo "✅ 前端 Dockerfile 已配置 API URL 參數"
else
    echo "❌ 錯誤：前端 Dockerfile 缺少 API URL 參數配置"
    exit 1
fi

if grep -q "ARG NEXT_PUBLIC_API_BASE_URL" inventory-api/Dockerfile; then
    echo "⚠️  警告：後端 Dockerfile 不應包含前端環境變數"
fi

# 檢查 GitHub Actions 工作流程
echo "🔍 檢查 GitHub Actions 配置..."
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "✅ GitHub Actions 部署工作流程存在"
else
    echo "❌ 錯誤：GitHub Actions 部署工作流程不存在"
    exit 1
fi

# 檢查環境變數範例檔案
echo "🔍 檢查環境變數配置..."
if [ -f "inventory-api/env.example" ]; then
    echo "✅ 後端環境變數範例檔案存在"
else
    echo "❌ 錯誤：後端環境變數範例檔案不存在"
    exit 1
fi

# 檢查 PHP 版本（確保支援 Google Cloud SDK）
echo "🔍 檢查 PHP 版本..."
cd inventory-api
php_version=$(php -r "echo PHP_VERSION;")
echo "📋 當前 PHP 版本：$php_version"

if php -r "exit(version_compare(PHP_VERSION, '8.2.0', '>=') ? 0 : 1);"; then
    echo "✅ PHP 版本符合要求"
else
    echo "❌ 錯誤：需要 PHP 8.2 或更高版本，當前版本：$php_version"
    cd ..
    exit 1
fi

# 檢查 Composer 是否可以正常運行
echo "🔍 檢查 Composer 狀態..."
if ! composer check-platform-reqs --no-dev > /dev/null 2>&1; then
    echo "⚠️  警告：Composer 平台需求檢查失敗，但繼續執行"
else
    echo "✅ Composer 平台需求檢查通過"
fi

# 生成 Laravel APP_KEY（如果需要）
echo "🔑 檢查 Laravel APP_KEY..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env 檔案不存在，複製範例檔案..."
    cp env.example .env
fi

# 檢查 APP_KEY 是否存在
if ! grep -q "APP_KEY=base64:" .env; then
    echo "🔑 生成新的 Laravel APP_KEY..."
    php artisan key:generate
    echo "✅ Laravel APP_KEY 已生成"
else
    echo "✅ Laravel APP_KEY 已存在"
fi

# 顯示生成的 APP_KEY
echo "📋 您的 Laravel APP_KEY（請在 GCP Secret Manager 中使用）："
php artisan key:generate --show

cd ..

echo ""
echo "🎉 GCP 部署準備完成！"
echo ""
echo "📋 接下來的步驟："
echo "1. 執行統一部署腳本：./deploy-to-gcp.sh"
echo "2. 根據腳本輸出在 GitHub Secrets 中設定必要的環境變數"
echo "3. 在 GCP Secret Manager 中設定密鑰值"
echo "4. 推送程式碼到 master 分支觸發部署"
echo ""
echo "📖 詳細步驟請參考：GCP_Deployment_Plan.md"
echo ""
echo "🔧 已安裝的 Google Cloud Storage 依賴："
echo "   - google/cloud-storage (官方 SDK)"
echo "   - league/flysystem-google-cloud-storage (Laravel 檔案系統適配器)" 