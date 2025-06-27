#!/bin/bash
# 備份腳本 - 在 API Platform 遷移前執行

echo "🔄 開始備份程序..."

# 1. 創建備份標籤
DATE=$(date +%Y%m%d_%H%M%S)
TAG_NAME="pre-api-platform-$DATE"

echo "📌 創建 Git 標籤: $TAG_NAME"
git tag -a "$TAG_NAME" -m "Backup before API Platform migration"

# 2. 備份 Scribe 配置
echo "📁 備份 Scribe 配置..."
cp config/scribe.php "config/scribe.php.backup-$DATE"

# 3. 備份 Scribe 生成的文檔
if [ -d "storage/app/private/scribe" ]; then
    echo "📁 備份 Scribe 文檔..."
    cp -r storage/app/private/scribe "storage/app/private/scribe.backup-$DATE"
fi

# 4. 備份現有路由列表
echo "📝 備份路由列表..."
php artisan route:list > "routes-backup-$DATE.txt"

# 5. 建立配置備份
echo "📁 備份關鍵配置文件..."
mkdir -p "backup/$DATE"
cp config/auth.php "backup/$DATE/"
cp config/sanctum.php "backup/$DATE/"
cp routes/api.php "backup/$DATE/"

echo "✅ 備份完成！"
echo "📍 備份標籤: $TAG_NAME"
echo "📂 備份目錄: backup/$DATE/" 