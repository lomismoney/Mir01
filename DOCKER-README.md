# 🐳 Docker 快速部署指南

## 30 秒快速開始

```bash
# 1. 克隆專案
git clone <repository-url>
cd Mir01

# 2. 初始化部署
./deploy.sh init

# 3. 訪問應用
# 前端: http://localhost:3000
# 後端: http://localhost:8080
```

## 📋 前置需求

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM

## 🚀 部署命令

| 命令 | 說明 |
|------|------|
| `./deploy.sh init` | 初始化部署（第一次） |
| `./deploy.sh up` | 啟動所有服務 |
| `./deploy.sh down` | 停止所有服務 |
| `./deploy.sh logs` | 查看日誌 |
| `./deploy.sh status` | 檢查服務狀態 |
| `./deploy.sh backup` | 備份資料庫 |

## 🔧 環境配置

1. **複製環境變數範例**
   ```bash
   cp docker-env-example .env
   ```

2. **編輯 .env 檔案**
   - 設定資料庫密碼
   - 配置域名（生產環境）
   - 生成 NextAuth 密鑰

## 📁 專案結構

```
Mir01/
├── docker-compose.yml      # 服務編排
├── deploy.sh              # 部署腳本
├── inventory-api/         # 後端
│   └── Dockerfile        
├── inventory-client/      # 前端
│   └── Dockerfile        
└── docker-env-example     # 環境範例
```

## 🌐 默認端口

- 前端：3000
- 後端 API：8080
- MySQL：3306
- Redis：6379
- phpMyAdmin：8888（開發環境）

## 🛠️ 開發環境

啟用 phpMyAdmin：
```bash
docker-compose --profile dev up -d
```

## 📚 更多資訊

- [完整部署指南](Docker部署指南.md)
- [檔案結構說明](DOCKER-DEPLOYMENT.md)
- [部署總覽](部署指南.md)

## ⚡ 快速故障排除

**端口被佔用？**
```bash
# 修改 .env 中的端口設定
API_PORT=8081
FRONTEND_PORT=3001
```

**資料庫連接失敗？**
```bash
# 檢查 MySQL 狀態
docker-compose logs mysql
```

**需要重新構建？**
```bash
docker-compose build --no-cache
```

---

💡 **提示**：生產環境部署請參考 [Docker部署指南.md](Docker部署指南.md) 的詳細說明。 