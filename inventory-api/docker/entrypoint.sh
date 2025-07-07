#!/bin/bash
set -e

# Cloud Run 特殊處理
if [ -n "$PORT" ]; then
    echo "檢測到 Cloud Run 環境，PORT=$PORT"
    # 動態設置 Nginx 監聽端口
    sed -i "s/listen 8080;/listen $PORT;/g" /etc/nginx/sites-available/default
fi

# 簡化版本：不等待資料庫，讓 Cloud Run 健康檢查處理
echo "跳過資料庫連接檢查（Cloud Run 環境）"

# 注意：資料庫遷移應該通過 Cloud Run Jobs 執行，而不是在容器啟動時
# 這樣可以避免啟動超時問題
echo "跳過資料庫遷移（應通過 Cloud Run Jobs 執行）"

# 生成應用程式密鑰（如果不存在）
if [ -z "$APP_KEY" ]; then
    echo "生成應用程式密鑰..."
    php artisan key:generate --force
fi

# 清除和優化快取
echo "優化應用程式..."
# 注意：不執行 config:cache，因為配置文件使用了 env() 函數
# 這會導致環境變數在構建時被固定，而非運行時動態讀取
# php artisan config:cache

# 路由快取是安全的，因為路由定義不依賴環境變數
php artisan route:cache

# 視圖快取也是安全的
php artisan view:cache

# 建立儲存符號連結
echo "建立儲存符號連結..."
php artisan storage:link || true

# 生成 API 文檔
echo "生成 API 文檔..."
php artisan scribe:generate || true

# 確保權限正確
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 啟動 Supervisor
echo "啟動應用程式..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf 