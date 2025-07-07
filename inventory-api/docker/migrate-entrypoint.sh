#!/bin/bash
set -e

echo "🚀 開始資料庫遷移..."

# 從 Metadata Server 獲取專案資訊（如果在 GCP 環境中）
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "嘗試從 Metadata Server 獲取專案 ID..."
    GOOGLE_CLOUD_PROJECT=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/project/project-id 2>/dev/null || echo "")
fi

# 如果還是沒有專案 ID，從 Cloud SQL 連線名稱提取
if [ -z "$GOOGLE_CLOUD_PROJECT" ] && [ -n "$CLOUDSQL_CONNECTION_NAME" ]; then
    GOOGLE_CLOUD_PROJECT=$(echo "$CLOUDSQL_CONNECTION_NAME" | cut -d: -f1)
fi

# 動態構建 DB_HOST（如果未設定）
if [ -z "$DB_HOST" ] && [ -n "$GOOGLE_CLOUD_PROJECT" ]; then
    # 從環境變數獲取區域（預設為 asia-east1）
    REGION="${GOOGLE_CLOUD_REGION:-asia-east1}"
    INSTANCE="${DB_INSTANCE_NAME:-lomis-db-instance}"
    DB_HOST="/cloudsql/${GOOGLE_CLOUD_PROJECT}:${REGION}:${INSTANCE}"
    echo "構建 Cloud SQL 連線: $DB_HOST"
fi

# 設定環境變數
export DB_HOST
export GOOGLE_CLOUD_PROJECT

echo "資料庫連線資訊："
echo "  DB_HOST: $DB_HOST"
echo "  DB_DATABASE: $DB_DATABASE"
echo "  DB_USERNAME: $DB_USERNAME"
echo "  專案 ID: $GOOGLE_CLOUD_PROJECT"

# 等待資料庫連線（最多 30 秒）
echo "檢查資料庫連線..."
for i in {1..6}; do
    if php artisan db:show >/dev/null 2>&1; then
        echo "✅ 資料庫連線成功"
        break
    fi
    echo "等待資料庫連線... ($i/6)"
    sleep 5
done

# 執行遷移
echo "執行資料庫遷移..."
php artisan migrate --force

echo "✅ 資料庫遷移完成"