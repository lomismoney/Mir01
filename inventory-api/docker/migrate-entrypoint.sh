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

# 使用 Unix socket 連線 (Cloud SQL 推薦方式)
if [ -n "$INSTANCE_CONNECTION_NAME" ]; then
    DB_SOCKET="/cloudsql/${INSTANCE_CONNECTION_NAME}"
    echo "使用 Unix socket 連線: $DB_SOCKET"
    # 清空 DB_HOST，強制使用 socket
    export DB_HOST=""
    export DB_SOCKET
elif [ -n "$DB_SOCKET" ]; then
    echo "使用提供的 Unix socket: $DB_SOCKET"
    export DB_HOST=""
    export DB_SOCKET
fi

# 設定環境變數
export GOOGLE_CLOUD_PROJECT

echo "資料庫連線資訊："
echo "  DB_SOCKET: ${DB_SOCKET:-未設定}"
echo "  DB_HOST: ${DB_HOST:-未設定}"
echo "  DB_DATABASE: $DB_DATABASE"
echo "  DB_USERNAME: $DB_USERNAME"
echo "  DB_PASSWORD: $([ -n "$DB_PASSWORD" ] && echo "已設定" || echo "未設定")"
echo "  LARAVEL_DB_PASSWORD: $([ -n "$LARAVEL_DB_PASSWORD" ] && echo "已設定" || echo "未設定")"
echo "  專案 ID: $GOOGLE_CLOUD_PROJECT"
echo "  連線方式: $([ -n "$DB_SOCKET" ] && echo "Unix Socket" || echo "TCP/IP")"

# 確保密碼環境變數正確設定
if [ -n "$LARAVEL_DB_PASSWORD" ] && [ -z "$DB_PASSWORD" ]; then
    export DB_PASSWORD="$LARAVEL_DB_PASSWORD"
    echo "設定 DB_PASSWORD 從 LARAVEL_DB_PASSWORD"
fi

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