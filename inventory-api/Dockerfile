# Laravel 11 後端 Dockerfile
# 使用官方 PHP 8.2 FPM 映像作為基礎
FROM php:8.2-fpm

# 設定工作目錄
WORKDIR /var/www/html

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    nginx \
    supervisor

# 清理 apt 緩存
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# 安裝 PHP 擴展
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip opcache

# 安裝 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 複製應用程式代碼
COPY . /var/www/html

# 設定儲存目錄權限
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 安裝 PHP 依賴
RUN composer install --no-dev --optimize-autoloader

# 注意：OpenAPI 文檔會在容器啟動時由 entrypoint.sh 生成
# 這裡不生成是因為建置時沒有完整的環境（資料庫連接等）

# 複製 Nginx 配置
COPY docker/nginx/default.conf /etc/nginx/sites-available/default

# 移除預設的 Nginx 配置並創建必要的目錄
RUN rm -f /etc/nginx/sites-enabled/default \
    && mkdir -p /etc/nginx/sites-enabled \
    && mkdir -p /var/log/nginx

# 複製 Supervisor 配置
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 創建日誌目錄
RUN mkdir -p /var/log/supervisor

# 暴露端口 (Cloud Run 要求 8080)
EXPOSE 8080

# 啟動腳本
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# 遷移腳本（用於 Cloud Run Jobs）
COPY docker/migrate-entrypoint.sh /usr/local/bin/migrate-entrypoint.sh
RUN chmod +x /usr/local/bin/migrate-entrypoint.sh

# OpenAPI 生成腳本（用於 Cloud Run Jobs）
COPY docker/openapi-entrypoint.sh /usr/local/bin/openapi-entrypoint.sh
RUN chmod +x /usr/local/bin/openapi-entrypoint.sh

# 使用 Supervisor 管理 Nginx 和 PHP-FPM
CMD ["/usr/local/bin/entrypoint.sh"] 