#!/bin/bash

# 庫存管理系統 Docker 部署腳本
# 用於簡化部署流程

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函數：顯示訊息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 函數：檢查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "$1 未安裝，請先安裝 $1"
    fi
}

# 函數：顯示使用說明
usage() {
    echo "使用方法: ./deploy.sh [選項]"
    echo ""
    echo "選項:"
    echo "  build     構建 Docker 映像"
    echo "  up        啟動所有服務"
    echo "  down      停止所有服務"
    echo "  restart   重啟所有服務"
    echo "  logs      查看服務日誌"
    echo "  backup    備份資料庫"
    echo "  restore   恢復資料庫"
    echo "  update    更新並重新部署"
    echo "  init      初始化部署（第一次部署）"
    echo "  status    檢查服務狀態"
    echo ""
    echo "範例:"
    echo "  ./deploy.sh init      # 第一次部署"
    echo "  ./deploy.sh update    # 更新部署"
    echo "  ./deploy.sh logs api  # 查看 API 日誌"
    exit 1
}

# 檢查必要命令
info "檢查系統需求..."
check_command docker
check_command docker-compose

# 檢查 .env 檔案
check_env() {
    if [ ! -f .env ]; then
        warning ".env 檔案不存在，從範例檔案創建..."
        cp docker-env-example .env
        error "請編輯 .env 檔案並填入實際配置值，然後重新執行腳本"
    fi
}

# 主要操作
case "$1" in
    "build")
        info "構建 Docker 映像..."
        docker-compose build --no-cache
        info "構建完成！"
        ;;
        
    "up")
        check_env
        info "啟動服務..."
        docker-compose up -d
        info "服務已啟動！"
        echo ""
        info "前端地址: http://localhost:3000"
        info "後端地址: http://localhost:8080"
        ;;
        
    "down")
        info "停止服務..."
        docker-compose down
        info "服務已停止！"
        ;;
        
    "restart")
        info "重啟服務..."
        docker-compose restart
        info "服務已重啟！"
        ;;
        
    "logs")
        if [ -z "$2" ]; then
            docker-compose logs -f --tail=100
        else
            docker-compose logs -f --tail=100 $2
        fi
        ;;
        
    "backup")
        info "備份資料庫..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        backup_file="backups/inventory_backup_${timestamp}.sql"
        mkdir -p backups
        
        docker-compose exec -T mysql mysqldump -u root -p${DB_ROOT_PASSWORD:-root_password} inventory > $backup_file
        info "備份完成: $backup_file"
        ;;
        
    "restore")
        if [ -z "$2" ]; then
            error "請指定備份檔案路徑"
        fi
        
        if [ ! -f "$2" ]; then
            error "備份檔案不存在: $2"
        fi
        
        warning "即將恢復資料庫，這將覆蓋現有資料！"
        read -p "確定要繼續嗎？(y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "恢復資料庫..."
            docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD:-root_password} inventory < $2
            info "資料庫恢復完成！"
        else
            info "取消恢復"
        fi
        ;;
        
    "update")
        info "更新部署..."
        
        # 拉取最新代碼
        info "拉取最新代碼..."
        git pull origin main
        
        # 停止服務
        info "停止服務..."
        docker-compose down
        
        # 重新構建
        info "重新構建映像..."
        docker-compose build --no-cache
        
        # 啟動服務
        info "啟動服務..."
        docker-compose up -d
        
        info "更新完成！"
        ;;
        
    "init")
        check_env
        
        info "初始化部署..."
        
        # 生成密鑰
        if grep -q "NEXTAUTH_SECRET=your_nextauth_secret_here" .env; then
            info "生成 NextAuth 密鑰..."
            secret=$(openssl rand -base64 32)
            sed -i.bak "s/NEXTAUTH_SECRET=your_nextauth_secret_here/NEXTAUTH_SECRET=$secret/" .env
            rm -f .env.bak
        fi
        
        # 構建映像
        info "構建 Docker 映像..."
        docker-compose build
        
        # 啟動服務
        info "啟動服務..."
        docker-compose up -d
        
        # 等待資料庫就緒
        info "等待資料庫就緒..."
        sleep 10
        
        # 執行遷移
        info "執行資料庫遷移..."
        docker-compose exec api php artisan migrate --force
        
        # 生成 API 文檔
        info "生成 API 文檔..."
        docker-compose exec api php artisan scribe:generate || true
        
        info "初始化完成！"
        echo ""
        info "前端地址: http://localhost:3000"
        info "後端地址: http://localhost:8080"
        
        if [ "$APP_ENV" = "development" ]; then
            info "phpMyAdmin: http://localhost:8888"
        fi
        ;;
        
    "status")
        info "服務狀態:"
        docker-compose ps
        ;;
        
    *)
        usage
        ;;
esac 