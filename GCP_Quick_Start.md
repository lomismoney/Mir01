# GCP 部署快速入門指南

## 🚀 一鍵部署到 Google Cloud Platform

本指南提供最簡化的步驟，讓您快速將庫存管理系統部署到 GCP。

## 📋 前置需求

1. **Google Cloud CLI 已安裝並登入**
   ```bash
   gcloud auth login
   gcloud config set project turnkey-pottery-461707-b5
   ```

2. **PHP 8.2+ 和 Composer 已安裝**
3. **Node.js 和 npm 已安裝**

## ⚡ 快速部署步驟

### 第一步：準備環境
```bash
./prepare-gcp-deployment.sh
```
這個腳本會：
- 安裝 Google Cloud Storage 依賴
- 檢查所有配置文件
- 生成 Laravel APP_KEY
- 驗證 PHP 和 Composer 環境

### 第二步：一鍵部署到 GCP
```bash
./deploy-to-gcp.sh
```
這個腳本會自動：
- 建立所有 GCP 資源（Cloud SQL、Cloud Storage、Artifact Registry）
- 配置服務帳號和權限
- 設定 Workload Identity Federation
- 建立 Secret Manager 密鑰
- 輸出完整的配置資訊

### 第三步：設定 GitHub Secrets
根據 `deploy-to-gcp.sh` 的輸出，在 GitHub Repository 中設定以下 Secrets：

```
GCP_PROJECT_ID: turnkey-pottery-461707-b5
GCS_BUCKET: lomis_internal_inventory_assets
CLOUD_SQL_CONNECTION_NAME: turnkey-pottery-461707-b5:asia-east1:lomis-db-instance
GCP_WORKLOAD_IDENTITY_PROVIDER: projects/672374290013/locations/global/workloadIdentityPools/[POOL_ID]/providers/github-provider
GCP_SERVICE_ACCOUNT: github-deploy-sa@turnkey-pottery-461707-b5.iam.gserviceaccount.com
```

### 第四步：設定 Secret Manager
在 GCP Console > Secret Manager 中設定：
- `LARAVEL_APP_KEY`: 腳本輸出的 APP_KEY
- `LARAVEL_DB_PASSWORD`: 設定一個強密碼

### 第五步：觸發部署
推送程式碼到 master 分支：
```bash
git add .
git commit -m "feat: configure GCP deployment"
git push origin master
```

## 🎯 就是這麼簡單！

只需要執行兩個腳本，設定幾個 Secrets，您的應用程式就會自動部署到 GCP 了！

## 🔧 故障排除

如果遇到問題，請參考：
- [GCP_Deployment_Plan.md](./GCP_Deployment_Plan.md) - 詳細部署計劃
- [部署指南.md](./部署指南.md) - 完整部署文檔

## 📞 需要幫助？

如果您在部署過程中遇到任何問題，請檢查：
1. Google Cloud CLI 是否正確配置
2. 專案 ID 是否正確
3. 必要的 API 是否已啟用
4. GitHub Secrets 是否正確設定 