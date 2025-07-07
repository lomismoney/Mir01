#!/bin/bash
set -e

echo "🚀 開始生成 OpenAPI 文檔..."

# 從 Metadata Server 獲取專案資訊（如果在 GCP 環境中）
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "嘗試從 Metadata Server 獲取專案 ID..."
    GOOGLE_CLOUD_PROJECT=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/project/project-id 2>/dev/null || echo "")
fi

# 使用 Unix socket 連線 (Cloud SQL 推薦方式)
if [ -n "$INSTANCE_CONNECTION_NAME" ]; then
    DB_SOCKET="/cloudsql/${INSTANCE_CONNECTION_NAME}"
    echo "使用 Unix socket 連線: $DB_SOCKET"
    export DB_HOST=""
    export DB_SOCKET
elif [ -n "$DB_SOCKET" ]; then
    echo "使用提供的 Unix socket: $DB_SOCKET"
    export DB_HOST=""
fi

# 設定環境變數
export GOOGLE_CLOUD_PROJECT

echo "資料庫連線資訊："
echo "  DB_SOCKET: ${DB_SOCKET:-未設定}"
echo "  DB_HOST: ${DB_HOST:-未設定}"
echo "  DB_DATABASE: $DB_DATABASE"
echo "  DB_USERNAME: $DB_USERNAME"
echo "  專案 ID: $GOOGLE_CLOUD_PROJECT"

# 確保密碼環境變數正確設定
if [ -n "$LARAVEL_DB_PASSWORD" ] && [ -z "$DB_PASSWORD" ]; then
    export DB_PASSWORD="$LARAVEL_DB_PASSWORD"
    echo "設定 DB_PASSWORD 從 LARAVEL_DB_PASSWORD"
fi

# 等待資料庫連線
echo "檢查資料庫連線..."
for i in {1..6}; do
    if php artisan db:show >/dev/null 2>&1; then
        echo "✅ 資料庫連線成功"
        break
    fi
    echo "等待資料庫連線... ($i/6)"
    sleep 5
done

# 生成 OpenAPI 文檔
echo "生成 OpenAPI 文檔..."
php artisan scribe:generate --force

# 找到生成的 OpenAPI 檔案（可能在不同位置）
OPENAPI_FILE=""
if [ -f "storage/app/private/scribe/openapi.yaml" ]; then
    OPENAPI_FILE="storage/app/private/scribe/openapi.yaml"
elif [ -f "storage/app/scribe/openapi.yaml" ]; then
    OPENAPI_FILE="storage/app/scribe/openapi.yaml"
elif [ -f ".scribe/openapi.yaml" ]; then
    OPENAPI_FILE=".scribe/openapi.yaml"
fi

if [ -n "$OPENAPI_FILE" ]; then
    echo "✅ OpenAPI 文檔生成成功：$OPENAPI_FILE"
    
    # 使用掛載的 GCS 路徑
    if [ -n "$GCS_MOUNT_PATH" ] && [ -d "$GCS_MOUNT_PATH" ]; then
        echo "使用掛載的 GCS 路徑：$GCS_MOUNT_PATH"
        mkdir -p "$GCS_MOUNT_PATH/openapi"
        cp "$OPENAPI_FILE" "$GCS_MOUNT_PATH/openapi/openapi-latest.yaml"
        cp "$OPENAPI_FILE" "$GCS_MOUNT_PATH/openapi/openapi-$(date +%Y%m%d-%H%M%S).yaml"
        echo "✅ OpenAPI 已複製到掛載的 GCS"
        ls -la "$GCS_MOUNT_PATH/openapi/"
    elif [ -n "$GCS_BUCKET" ]; then
        echo "使用 gsutil 上傳到 GCS..."
        gsutil cp "$OPENAPI_FILE" gs://${GCS_BUCKET}/openapi/openapi-latest.yaml
        gsutil cp "$OPENAPI_FILE" gs://${GCS_BUCKET}/openapi/openapi-$(date +%Y%m%d-%H%M%S).yaml
        echo "✅ OpenAPI 已上傳到 GCS"
    else
        echo "⚠️ 未設定 GCS_MOUNT_PATH 或 GCS_BUCKET，跳過上傳"
    fi
    
    # 顯示檔案資訊
    echo "檔案大小：$(wc -l < "$OPENAPI_FILE") 行"
    echo "前 20 行內容："
    head -20 "$OPENAPI_FILE"
else
    echo "❌ 找不到生成的 OpenAPI 檔案"
    echo "搜尋所有 YAML 檔案："
    find . -name "*.yaml" -o -name "*.yml" | head -20
    exit 1
fi

echo "✅ OpenAPI 生成任務完成"