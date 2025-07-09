# Laravel 11 後端 Dockerfile (超速生產級構建 - 優化版)

# Stage 1: 基礎 PHP 擴展層 (最少變動，最高快取命中率)
FROM php:8.2-fpm-alpine AS php-base

# 🚀 批量安裝系統依賴 (一次性，充分利用 Docker 層快取)
RUN apk add --no-cache \
    # 構建依賴
    $PHPIZE_DEPS freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev libzip-dev oniguruma-dev \
    # 運行時依賴
    freetype libjpeg-turbo libpng libwebp libzip oniguruma git unzip \
    # 生產環境依賴
    nginx supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif pcntl bcmath gd zip opcache \
    && apk del $PHPIZE_DEPS \
    && rm -rf /var/cache/apk/*

# 🔧 預設置 PHP 生產環境配置 (快取友好)
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# PHP 優化配置 (單層快取)
COPY <<EOF /usr/local/etc/php/conf.d/laravel.ini
; Laravel 生產環境優化
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
opcache.enable_cli=1
opcache.validate_timestamps=0

; 上傳和執行限制
upload_max_filesize=50M
post_max_size=50M
max_execution_time=300
memory_limit=512M
max_input_vars=3000

; 錯誤處理
log_errors=On
error_log=/var/log/php_errors.log
display_errors=Off

; 性能優化
realpath_cache_size=4096K
realpath_cache_ttl=600
EOF

# Stage 2: Composer 依賴層 (獨立快取，充分利用 composer.lock)
FROM php-base AS composer-deps

# 安裝 Composer (固定版本，快取友好)
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 🎯 關鍵優化：先複製 Composer 文件，再安裝依賴
COPY composer.json composer.lock ./

# 🚀 優化的 Composer 安裝 (生產級)
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction \
    && composer clear-cache

# Stage 3: 應用程式構建層
FROM composer-deps AS app-builder

# 複製應用程式代碼 (這層變動最頻繁，放在最後)
COPY . .

# 生成最終的 autoloader
RUN composer dump-autoload --optimize --no-dev --no-interaction

# Stage 4: 生產運行環境 (輕量級)
FROM php-base AS runner

WORKDIR /var/www/html

# 🔧 預創建目錄結構 (避免運行時權限問題)
RUN mkdir -p \
    /var/www/html/storage/logs \
    /var/www/html/storage/framework/{cache,sessions,views} \
    /var/www/html/bootstrap/cache \
    /run/nginx \
    /var/log/supervisor \
    && getent group www-data || addgroup -g 82 -S www-data \
    && getent passwd www-data || adduser -u 82 -D -S -G www-data www-data

# 🎯 從構建階段複製最終應用 (單次複製，最小化層級)
COPY --from=app-builder --chown=www-data:www-data /var/www/html /var/www/html

# 🔧 生產環境配置文件 (合併配置，減少層級)
# PHP-FPM 配置
COPY <<EOF /usr/local/etc/php-fpm.d/www.conf
[www]
user = www-data
group = www-data
listen = 127.0.0.1:9000
listen.owner = www-data
listen.group = www-data

; Cloud Run 優化 - 突發流量支援
pm = dynamic
pm.max_children = 100
pm.start_servers = 15
pm.min_spare_servers = 8
pm.max_spare_servers = 25
pm.max_requests = 1000
pm.process_idle_timeout = 20s
pm.max_spawn_rate = 15

; 監控和日誌
catch_workers_output = yes
decorate_workers_output = no
access.log = /proc/self/fd/2
slowlog = /proc/self/fd/2
request_slowlog_timeout = 8s
ping.path = /fpm-ping
ping.response = pong
pm.status_path = /fpm-status
EOF

# Nginx 優化配置
COPY <<EOF /etc/nginx/nginx.conf
worker_processes auto;
pid /run/nginx.pid;
error_log /dev/stderr warn;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
    accept_mutex off;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    access_log /dev/stdout main;

    # 性能優化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip 壓縮
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # 安全標頭
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    server {
        listen 8080;
        server_name _;
        root /var/www/html/public;
        index index.php;
        server_tokens off;

        location / {
            try_files \$uri \$uri/ /index.php?\$query_string;
        }

        location ~ \.php$ {
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass 127.0.0.1:9000;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
            fastcgi_param PATH_INFO \$fastcgi_path_info;
            
            fastcgi_buffering on;
            fastcgi_buffer_size 128k;
            fastcgi_buffers 4 256k;
            fastcgi_busy_buffers_size 256k;
            fastcgi_read_timeout 300;
        }

        location = /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        location ~ ^/(fpm-status|fpm-ping)$ {
            access_log off;
            fastcgi_pass 127.0.0.1:9000;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME \$fastcgi_script_name;
            allow 127.0.0.1;
            deny all;
        }

        location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        location ~* /\.(?:env|htaccess|htpasswd|git|svn)$ {
            deny all;
            access_log off;
            log_not_found off;
        }
    }
}
EOF

# Supervisor 配置
COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/dev/stdout
logfile_maxbytes=0
pidfile=/run/supervisord.pid

[program:nginx]
command=nginx -g 'daemon off;'
autostart=true
autorestart=true
priority=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:php-fpm]
command=php-fpm --nodaemonize
autostart=true
autorestart=true
priority=5
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

# 🚀 運行腳本 (合併創建，減少層級)
COPY <<'EOF' /usr/local/bin/run-artisan.sh
#!/bin/sh
set -e
echo "🔧 Cloud Run Job 執行: $@"
cd /var/www/html
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
echo "🚀 執行: php artisan $@"
exec php artisan "$@"
EOF

COPY <<'EOF' /usr/local/bin/start-server.sh
#!/bin/sh
set -e
echo "🚀 庫存系統啟動 (優化版 ~1-2秒)"

# 並行權限設定 (快速冷啟動)
(chown -R www-data:www-data storage bootstrap/cache &)
(chmod -R 775 storage bootstrap/cache &)
wait

# 生產環境快取 (並行執行)
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ 並行快取..."
    (php artisan config:cache 2>/dev/null &)
    (php artisan route:cache 2>/dev/null &) 
    (php artisan view:cache 2>/dev/null &)
    wait
fi

echo "✅ 啟動完成 | 並發: 100 req/instance"
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /usr/local/bin/start-server.sh /usr/local/bin/run-artisan.sh

EXPOSE 8080
CMD ["/usr/local/bin/start-server.sh"] 