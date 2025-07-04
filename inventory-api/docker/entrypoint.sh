#!/bin/bash
set -e

# 等待資料庫啟動
echo "等待資料庫連接..."
while ! php artisan db:monitor 2>/dev/null; do
  echo "資料庫尚未準備好，等待 5 秒..."
  sleep 5
done

echo "資料庫已連接！"

# 執行資料庫遷移
echo "執行資料庫遷移..."
php artisan migrate --force

# 生成應用程式密鑰（如果不存在）
if [ -z "$APP_KEY" ]; then
    echo "生成應用程式密鑰..."
    php artisan key:generate --force
fi

# 清除和優化快取
echo "優化應用程式..."
php artisan config:cache
php artisan route:cache
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