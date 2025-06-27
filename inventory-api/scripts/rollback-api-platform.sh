#!/bin/bash
# 回滾腳本 - 如需撤銷 API Platform 遷移時使用

echo "⚠️  開始回滾 API Platform..."
echo "⏸️  此操作將恢復到遷移前的狀態"
read -p "確定要繼續嗎？(y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ 取消回滾"
    exit 1
fi

# 1. 移除 API Platform
echo "📦 移除 API Platform 套件..."
composer remove api-platform/laravel

# 2. 恢復配置文件
if [ -f "config/api-platform.php" ]; then
    echo "🗑️  移除 API Platform 配置..."
    rm config/api-platform.php
fi

# 3. 清除緩存
echo "🧹 清除所有緩存..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# 4. 恢復到最近的備份標籤
LATEST_TAG=$(git tag -l "pre-api-platform-*" | sort -r | head -n 1)
if [ -n "$LATEST_TAG" ]; then
    echo "🔄 恢復到標籤: $LATEST_TAG"
    git checkout "$LATEST_TAG"
else
    echo "⚠️  找不到備份標籤，請手動恢復"
fi

# 5. 重新安裝依賴
echo "📦 重新安裝依賴..."
composer install --no-dev

echo "✅ 回滾完成！"
echo "📝 請檢查以下事項："
echo "   - 檢查 routes/api.php 是否正常"
echo "   - 測試現有 API 端點是否正常運作"
echo "   - 確認 Scribe 文檔生成是否正常" 