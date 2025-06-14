#!/bin/bash

# phpMyAdmin 部署腳本
# 用於在 Laravel Sail 環境中部署和管理 phpMyAdmin
# 作者：AI Assistant
# 版本：1.0

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 顯示標題
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  phpMyAdmin Docker 部署工具   ${NC}"
echo -e "${BLUE}  Laravel Sail 環境專用        ${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 檢查 Docker 是否運行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}錯誤: Docker 服務未運行，請先啟動 Docker${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker 服務運行正常${NC}"
}

# 檢查檔案是否存在
check_files() {
    if [ ! -f "./docker-compose.yml" ]; then
        echo -e "${RED}錯誤: 找不到 docker-compose.yml 檔案${NC}"
        echo -e "${YELLOW}請確保您在 inventory-api 目錄中執行此腳本${NC}"
        exit 1
    fi
    
    if [ ! -f "./.env" ]; then
        echo -e "${RED}錯誤: 找不到 .env 檔案${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 必要檔案檢查通過${NC}"
}

# 確保目錄存在
ensure_directories() {
    mkdir -p "./phpmyadmin"
    echo -e "${GREEN}✓ phpMyAdmin 配置目錄已建立${NC}"
}

# 啟動 phpMyAdmin
start_phpmyadmin() {
    echo -e "${YELLOW}正在啟動 phpMyAdmin...${NC}"
    
    # 先啟動資料庫服務（如果未運行）
    if ! docker compose ps mysql | grep -q "Up"; then
        echo -e "${YELLOW}正在啟動 MySQL 服務...${NC}"
        docker compose up -d mysql
        
        # 等待 MySQL 健康檢查通過
        echo -e "${YELLOW}等待 MySQL 服務就緒...${NC}"
        timeout=60
        while [ $timeout -gt 0 ]; do
            if docker compose ps mysql | grep -q "healthy"; then
                break
            fi
            echo -n "."
            sleep 2
            timeout=$((timeout-2))
        done
        echo ""
        
        if [ $timeout -le 0 ]; then
            echo -e "${RED}錯誤: MySQL 服務啟動超時${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}✓ MySQL 服務已就緒${NC}"
    fi
    
    # 啟動 phpMyAdmin
    docker compose up -d phpmyadmin
    
    # 檢查服務狀態
    sleep 5
    if docker compose ps phpmyadmin | grep -q "Up"; then
        echo -e "${GREEN}✓ phpMyAdmin 服務啟動成功${NC}"
        
        # 獲取訪問端口
        PHPMYADMIN_PORT=$(grep "PHPMYADMIN_PORT" .env | cut -d '=' -f2 || echo "8080")
        
        echo ""
        echo -e "${GREEN}🎉 phpMyAdmin 部署完成！${NC}"
        echo -e "${BLUE}訪問地址: http://localhost:${PHPMYADMIN_PORT}${NC}"
        echo ""
        echo -e "${YELLOW}登入資訊:${NC}"
        echo -e "  伺服器: mysql"
        echo -e "  用戶名: $(grep "DB_USERNAME" .env | cut -d '=' -f2)"
        echo -e "  密碼: $(grep "DB_PASSWORD" .env | cut -d '=' -f2)"
        echo ""
    else
        echo -e "${RED}錯誤: phpMyAdmin 服務啟動失敗${NC}"
        echo -e "${YELLOW}檢查日誌: docker compose logs phpmyadmin${NC}"
        exit 1
    fi
}

# 停止 phpMyAdmin
stop_phpmyadmin() {
    echo -e "${YELLOW}正在停止 phpMyAdmin...${NC}"
    docker compose stop phpmyadmin
    echo -e "${GREEN}✓ phpMyAdmin 服務已停止${NC}"
}

# 重啟 phpMyAdmin
restart_phpmyadmin() {
    echo -e "${YELLOW}正在重啟 phpMyAdmin...${NC}"
    docker compose restart phpmyadmin
    
    sleep 3
    if docker compose ps phpmyadmin | grep -q "Up"; then
        echo -e "${GREEN}✓ phpMyAdmin 服務重啟成功${NC}"
        
        PHPMYADMIN_PORT=$(grep "PHPMYADMIN_PORT" .env | cut -d '=' -f2 || echo "8080")
        echo -e "${BLUE}訪問地址: http://localhost:${PHPMYADMIN_PORT}${NC}"
    else
        echo -e "${RED}錯誤: phpMyAdmin 服務重啟失敗${NC}"
        exit 1
    fi
}

# 查看服務狀態
status_phpmyadmin() {
    echo -e "${BLUE}phpMyAdmin 服務狀態:${NC}"
    docker compose ps phpmyadmin
    echo ""
    
    if docker compose ps phpmyadmin | grep -q "Up"; then
        PHPMYADMIN_PORT=$(grep "PHPMYADMIN_PORT" .env | cut -d '=' -f2 || echo "8080")
        echo -e "${GREEN}✓ 服務運行中${NC}"
        echo -e "${BLUE}訪問地址: http://localhost:${PHPMYADMIN_PORT}${NC}"
    else
        echo -e "${YELLOW}⚠ 服務未運行${NC}"
    fi
}

# 查看日誌
logs_phpmyadmin() {
    echo -e "${BLUE}phpMyAdmin 服務日誌 (按 Ctrl+C 退出):${NC}"
    docker compose logs -f phpmyadmin
}

# 清理 phpMyAdmin
cleanup_phpmyadmin() {
    echo -e "${YELLOW}正在清理 phpMyAdmin...${NC}"
    
    # 停止並移除容器
    docker compose down phpmyadmin
    
    # 移除 volume（可選）
    read -p "是否要刪除 phpMyAdmin 的 session 資料？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume rm -f inventory-api_phpmyadmin-sessions 2>/dev/null || true
        echo -e "${GREEN}✓ Session 資料已清除${NC}"
    fi
    
    echo -e "${GREEN}✓ phpMyAdmin 清理完成${NC}"
}

# 顯示幫助
show_help() {
    echo -e "${BLUE}使用方法:${NC}"
    echo "  $0 [命令]"
    echo ""
    echo -e "${BLUE}可用命令:${NC}"
    echo "  start    - 啟動 phpMyAdmin 服務"
    echo "  stop     - 停止 phpMyAdmin 服務"
    echo "  restart  - 重啟 phpMyAdmin 服務"
    echo "  status   - 查看服務狀態"
    echo "  logs     - 查看服務日誌"
    echo "  cleanup  - 清理 phpMyAdmin"
    echo "  help     - 顯示此幫助訊息"
    echo ""
    echo -e "${BLUE}範例:${NC}"
    echo "  $0 start     # 啟動 phpMyAdmin"
    echo "  $0 status    # 查看狀態"
    echo "  $0 logs      # 查看日誌"
}

# 主程序
main() {
    case "${1:-start}" in
        "start")
            check_docker
            check_files
            ensure_directories
            start_phpmyadmin
            ;;
        "stop")
            check_docker
            stop_phpmyadmin
            ;;
        "restart")
            check_docker
            restart_phpmyadmin
            ;;
        "status")
            check_docker
            status_phpmyadmin
            ;;
        "logs")
            check_docker
            logs_phpmyadmin
            ;;
        "cleanup")
            check_docker
            cleanup_phpmyadmin
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}錯誤: 未知命令 '$1'${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 執行主程序
main "$@" 