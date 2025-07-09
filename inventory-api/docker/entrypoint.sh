#!/bin/bash
set -e

echo "🚀 啟動容器..."
echo "環境變數 PORT: $PORT"

# Cloud Run 特殊處理
if [ -n "$PORT" ]; then
    echo "檢測到 Cloud Run 環境，PORT=$PORT"
    # 動態設置 Nginx 監聽端口
    echo "修改 Nginx 配置以監聽端口 $PORT..."
    sed -i "s/listen 8080;/listen $PORT;/g" /etc/nginx/sites-available/default
    echo "✅ Nginx 配置已更新"
    
    # 顯示修改後的配置
    echo "📋 Nginx 配置檢查："
    grep "listen" /etc/nginx/sites-available/default
else
    echo "使用預設端口 8080"
fi

# 簡化版本：不等待資料庫，讓 Cloud Run 健康檢查處理
echo "跳過資料庫連接檢查（Cloud Run 環境）"

# 注意：資料庫遷移應該通過 Cloud Run Jobs 執行，而不是在容器啟動時
# 這樣可以避免啟動超時問題
echo "跳過資料庫遷移（應通過 Cloud Run Jobs 執行）"

# 在 Cloud Run 環境中，APP_KEY 通過 Secret Manager 提供
# 跳過密鑰生成以避免 .env 檔案依賴問題
echo "跳過 APP_KEY 生成（使用 Secret Manager 提供的密鑰）"
echo "APP_KEY 狀態：$([ -n "$APP_KEY" ] && echo "已設定" || echo "未設定")"

# 清除和優化快取
echo "優化應用程式..."
# 注意：不執行 config:cache，因為配置文件使用了 env() 函數
# 這會導致環境變數在構建時被固定，而非運行時動態讀取
# php artisan config:cache

# 路由快取是安全的，因為路由定義不依賴環境變數
php artisan route:cache

# 視圖快取也是安全的
php artisan view:cache

# 跳過建立儲存符號連結（使用 GCS，不需要本地符號連結）
echo "跳過儲存符號連結（使用 Google Cloud Storage）"

# 生成 API 文檔
echo "生成 API 文檔..."
php artisan scribe:generate || true

# 確保權限正確
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 啟用 Nginx 站點
echo "啟用 Nginx 站點..."
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# 測試 Nginx 配置
echo "測試 Nginx 配置..."
nginx -t

# 啟動 Supervisor
echo "啟動應用程式..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf 