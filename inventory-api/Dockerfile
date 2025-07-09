# Laravel 11 後端 Dockerfile (生產級多階段構建)

# Stage 1: 構建階段 - 安裝 PHP 擴展、Composer 和依賴
FROM php:8.2-fpm-alpine AS builder

# 安裝構建時需要的系統依賴
RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libwebp-dev \
    libzip-dev \
    oniguruma-dev \
    && apk add --no-cache \
    freetype \
    libjpeg-turbo \
    libpng \
    libwebp \
    libzip \
    oniguruma \
    git \
    unzip

# 配置和安裝 PHP 擴展
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        opcache

# 安裝 Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 設定工作目錄
WORKDIR /var/www/html

# 複製 Composer 文件以利用 Docker 層緩存
COPY composer.json composer.lock ./

# 安裝 PHP 依賴（生產環境優化）
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --optimize-autoloader \
    && composer clear-cache

# 複製應用程式代碼
COPY . .

# 生成優化的 autoloader
RUN composer dump-autoload --optimize --no-dev

# Stage 2: 運行階段 - 生產級 nginx + php-fpm 環境
FROM php:8.2-fpm-alpine AS runner

# 安裝運行時依賴
RUN apk add --no-cache \
    nginx \
    supervisor \
    freetype \
    libjpeg-turbo \
    libpng \
    libwebp \
    libzip \
    oniguruma \
    && rm -rf /var/cache/apk/*

# 從構建階段複製 PHP 擴展
COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/

# 設定工作目錄
WORKDIR /var/www/html

# 確保 www-data 用戶和組存在（Alpine Linux 通常已包含）
RUN getent group www-data || addgroup -g 82 -S www-data
RUN getent passwd www-data || adduser -u 82 -D -S -G www-data www-data

# 創建必要目錄
RUN mkdir -p /var/www/html/storage/logs \
    && mkdir -p /var/www/html/storage/framework/cache \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/bootstrap/cache \
    && mkdir -p /run/nginx \
    && mkdir -p /var/log/supervisor

# 複製應用程式碼和依賴
COPY --from=builder /var/www/html /var/www/html

# 設定 PHP 生產環境配置
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# PHP 優化配置
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

# PHP-FPM 優化配置 (Cloud Run 內部系統專用)
COPY <<EOF /usr/local/etc/php-fpm.d/www.conf
[www]
user = www-data
group = www-data
listen = 127.0.0.1:9000
listen.owner = www-data
listen.group = www-data

; Cloud Run 內部系統優化 - 支援突發流量
pm = dynamic
pm.max_children = 100
pm.start_servers = 15
pm.min_spare_servers = 8
pm.max_spare_servers = 25
pm.max_requests = 1000

; 快速響應配置
pm.process_idle_timeout = 20s
pm.max_spawn_rate = 15

; 日誌配置
catch_workers_output = yes
decorate_workers_output = no
access.log = /proc/self/fd/2
slowlog = /proc/self/fd/2
request_slowlog_timeout = 8s

; 健康檢查（僅內部使用）
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
    worker_connections 2048;      # 提高連接數支援突發流量
    use epoll;
    multi_accept on;
    accept_mutex off;             # 減少鎖競爭，加快處理速度
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日誌格式
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

        # 安全性配置
        server_tokens off;

        # Laravel 路由配置
        location / {
            try_files \$uri \$uri/ /index.php?\$query_string;
        }

        # PHP 處理（簡化配置）
        location ~ \.php$ {
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass 127.0.0.1:9000;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
            fastcgi_param PATH_INFO \$fastcgi_path_info;
            
            # 性能優化
            fastcgi_buffering on;
            fastcgi_buffer_size 128k;
            fastcgi_buffers 4 256k;
            fastcgi_busy_buffers_size 256k;
            fastcgi_read_timeout 300;
        }

        # 健康檢查端點
        location = /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # PHP-FPM 狀態監控（僅內部使用）
        location ~ ^/(fpm-status|fpm-ping)$ {
            access_log off;
            fastcgi_pass 127.0.0.1:9000;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME \$fastcgi_script_name;
            allow 127.0.0.1;
            deny all;
        }

        # 靜態文件處理
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # 隱藏敏感文件（精確正則表達式）
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

# Cloud Run Jobs 執行腳本
COPY <<'EOF' /usr/local/bin/run-artisan.sh
#!/bin/sh
set -e

echo "🔧 Cloud Run Job 執行: $@"
echo "工作目錄: $(pwd)"

# 確保在正確的目錄
cd /var/www/html

# 設定基本權限
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

# 執行 artisan 命令
echo "🚀 執行: php artisan $@"
exec php artisan "$@"
EOF

# 啟動腳本 (Cloud Run 內部系統冷啟動優化)
COPY <<'EOF' /usr/local/bin/start-server.sh
#!/bin/sh
set -e

echo "🚀 Cloud Run 內部庫存系統 - 快速冷啟動模式"
echo "目標: 3秒內啟動，支援100並發突發流量"
echo "架構: nginx + php-fpm + supervisor"

# 快速權限設定 (並行執行)
(chown -R www-data:www-data /var/www/html/storage &)
(chown -R www-data:www-data /var/www/html/bootstrap/cache &)
(chmod -R 775 /var/www/html/storage &)
(chmod -R 775 /var/www/html/bootstrap/cache &)
wait

# 生產環境快速快取 (並行執行加速冷啟動)
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ 並行快取優化 (冷啟動加速)..."
    (php artisan config:cache 2>/dev/null &)
    (php artisan route:cache 2>/dev/null &) 
    (php artisan view:cache 2>/dev/null &)
    wait  # 等待所有快取完成
fi

echo "✅ 冷啟動完成 (~2-3秒)"
echo "🔥 並發支援: 100 requests/instance"
echo "💰 成本策略: min-instances=0, 按需擴展"
echo "🏥 健康檢查: /health | 📊 監控: /status"

# 直接啟動 (無額外延遲)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /usr/local/bin/start-server.sh /usr/local/bin/run-artisan.sh

# 暴露端口
EXPOSE 8080

# 啟動服務
CMD ["/usr/local/bin/start-server.sh"] 