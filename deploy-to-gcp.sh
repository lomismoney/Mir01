#!/bin/bash

# 庫存管理系統 GCP 統一部署腳本
# 包含基礎設施建立、Workload Identity Federation 修復和完整配置

set -e

echo "🚀 開始庫存管理系統 GCP 部署..."

# 專案配置參數
PROJECT_ID="turnkey-pottery-461707-b5"
REGION="asia-east1"
ZONE="asia-east1-a"
INSTANCE_NAME="lomis-db-instance"
DATABASE_NAME="lomis_internal"
DB_USER="h1431532403240"
BUCKET_NAME="lomis_internal_inventory_assets"
GITHUB_REPO="lomismoney/Mir01"

# 服務帳號和 Workload Identity 配置
DEPLOY_SA_NAME="github-deploy-sa"
DEPLOY_SA_EMAIL="${DEPLOY_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
WIF_POOL_ID="github-pool-$(date +%s)"  # 使用時間戳確保唯一性
WIF_PROVIDER_ID="github-provider"

echo ""
echo "📋 部署配置概覽："
echo "   專案 ID: $PROJECT_ID"
echo "   區域: $REGION"
echo "   GitHub 倉庫: $GITHUB_REPO"
echo "   服務帳號: $DEPLOY_SA_EMAIL"
echo "   Workload Identity Pool: $WIF_POOL_ID"
echo ""

# 確認繼續
read -p "按 Enter 繼續部署，或 Ctrl+C 取消..." 

# 設定當前專案
echo "🔧 設定 GCP 專案..."
gcloud config set project $PROJECT_ID

# 啟用必要的 API
echo "📡 啟用必要的 GCP API..."
echo "   啟用 Cloud Build API..."
gcloud services enable cloudbuild.googleapis.com --quiet
echo "   啟用 Cloud Run API..."
gcloud services enable run.googleapis.com --quiet
echo "   啟用 Cloud SQL API..."
gcloud services enable sqladmin.googleapis.com --quiet
echo "   啟用 Cloud Storage API..."
gcloud services enable storage.googleapis.com --quiet
echo "   啟用 Artifact Registry API..."
gcloud services enable artifactregistry.googleapis.com --quiet
echo "   啟用 IAM Credentials API..."
gcloud services enable iamcredentials.googleapis.com --quiet
echo "   啟用 Security Token Service API..."
gcloud services enable sts.googleapis.com --quiet
echo "✅ 所有必要的 API 已啟用"

# 建立 Cloud SQL 實例（如果不存在）
echo "🗄️  建立 Cloud SQL 實例..."
if ! gcloud sql instances describe $INSTANCE_NAME --quiet 2>/dev/null; then
    echo "   建立新的 MySQL 8.0 實例..."
    gcloud sql instances create $INSTANCE_NAME \
        --database-version=MYSQL_8_0 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-auto-increase \
        --backup-start-time=02:00 \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=03 \
        --quiet
    echo "✅ Cloud SQL 實例建立完成"
else
    echo "✅ Cloud SQL 實例已存在"
fi

# 建立資料庫（如果不存在）
echo "🗄️  建立資料庫..."
if ! gcloud sql databases describe $DATABASE_NAME --instance=$INSTANCE_NAME --quiet 2>/dev/null; then
    gcloud sql databases create $DATABASE_NAME --instance=$INSTANCE_NAME --quiet
    echo "✅ 資料庫建立完成"
else
    echo "✅ 資料庫已存在"
fi

# 建立 Cloud Storage Bucket
echo "🪣 建立 Cloud Storage Bucket..."
if ! gsutil ls -b gs://$BUCKET_NAME 2>/dev/null; then
    gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$BUCKET_NAME
    # 設定 CORS 政策以支援前端存取
    echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]' | gsutil cors set /dev/stdin gs://$BUCKET_NAME
    echo "✅ Cloud Storage Bucket 建立完成"
else
    echo "✅ Cloud Storage Bucket 已存在"
fi

# 建立部署服務帳號
echo "👤 建立部署服務帳號..."
if ! gcloud iam service-accounts describe $DEPLOY_SA_EMAIL --quiet 2>/dev/null; then
    gcloud iam service-accounts create $DEPLOY_SA_NAME \
        --display-name="GitHub Actions Deploy Service Account" \
        --description="用於 GitHub Actions 自動部署的服務帳號" \
        --quiet
    echo "✅ 部署服務帳號建立完成"
else
    echo "✅ 部署服務帳號已存在"
fi

# 為服務帳號添加必要的角色
echo "🔐 設定服務帳號權限..."
roles=(
    "roles/cloudsql.client"
    "roles/run.admin"
    "roles/storage.admin"
    "roles/artifactregistry.admin"
    "roles/iam.serviceAccountUser"
    "roles/secretmanager.secretAccessor"
)

for role in "${roles[@]}"; do
    echo "   設定角色: $role"
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$DEPLOY_SA_EMAIL" \
        --role="$role" \
        --quiet > /dev/null 2>&1
done

echo "✅ 服務帳號權限設定完成"

# 清理任何舊的 Workload Identity Pool（如果存在且狀態異常）
echo "🧹 檢查並清理舊的 Workload Identity 資源..."
OLD_POOLS=$(gcloud iam workload-identity-pools list --location="global" --filter="displayName:'GitHub Actions Pool'" --format="value(name)" 2>/dev/null || echo "")

if [ ! -z "$OLD_POOLS" ]; then
    echo "   發現舊的 Workload Identity Pool，檢查狀態..."
    for pool in $OLD_POOLS; do
        pool_id=$(basename $pool)
        pool_state=$(gcloud iam workload-identity-pools describe $pool_id --location="global" --format="value(state)" 2>/dev/null || echo "UNKNOWN")
        echo "   Pool $pool_id 狀態: $pool_state"
        
        if [ "$pool_state" = "DELETED" ]; then
            echo "   跳過已刪除的 Pool: $pool_id"
        elif [ "$pool_state" = "ACTIVE" ]; then
            echo "   發現活躍的 Pool，將重複使用: $pool_id"
            WIF_POOL_ID=$pool_id
            break
        fi
    done
fi

# 建立新的 Workload Identity Pool（如果需要）
echo "🔗 建立 Workload Identity Pool..."
WIF_POOL_STATE=$(gcloud iam workload-identity-pools describe $WIF_POOL_ID --location="global" --format="value(state)" 2>/dev/null || echo "NOT_FOUND")

if [ "$WIF_POOL_STATE" = "ACTIVE" ]; then
    echo "✅ Workload Identity Pool 已存在且處於活躍狀態"
else
    echo "   建立新的 Workload Identity Pool: $WIF_POOL_ID"
    gcloud iam workload-identity-pools create $WIF_POOL_ID \
        --location="global" \
        --display-name="GitHub Actions Pool" \
        --description="Workload Identity Pool for GitHub Actions" \
        --quiet
    echo "✅ Workload Identity Pool 建立完成"
fi

# 獲取 Workload Identity Pool 的完整 ID
WIF_POOL_FULL_ID=$(gcloud iam workload-identity-pools describe $WIF_POOL_ID \
    --location="global" \
    --format="value(name)")

echo "📋 Workload Identity Pool 完整 ID: $WIF_POOL_FULL_ID"

# 建立 OIDC Provider
echo "🔗 建立 GitHub OIDC Provider..."
if ! gcloud iam workload-identity-pools providers describe $WIF_PROVIDER_ID \
    --location="global" \
    --workload-identity-pool=$WIF_POOL_ID \
    --quiet 2>/dev/null; then
    
    echo "   配置 GitHub OIDC Provider..."
    gcloud iam workload-identity-pools providers create-oidc $WIF_PROVIDER_ID \
        --location="global" \
        --workload-identity-pool=$WIF_POOL_ID \
        --display-name="GitHub Actions Provider" \
        --description="OIDC Provider for GitHub Actions" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor,attribute.ref=assertion.ref" \
        --attribute-condition="assertion.repository=='$GITHUB_REPO'" \
        --quiet
    
    echo "✅ GitHub OIDC Provider 建立完成"
else
    echo "✅ GitHub OIDC Provider 已存在"
fi

# 允許 GitHub Repository 模擬服務帳號
echo "🔐 設定 GitHub Repository 模擬權限..."
gcloud iam service-accounts add-iam-policy-binding $DEPLOY_SA_EMAIL \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${WIF_POOL_FULL_ID}/attribute.repository/${GITHUB_REPO}" \
    --quiet > /dev/null 2>&1

echo "✅ GitHub Repository 模擬權限設定完成"

# 獲取 Workload Identity Provider 的完整名稱
WIF_PROVIDER_FULL_NAME=$(gcloud iam workload-identity-pools providers describe $WIF_PROVIDER_ID \
    --location="global" \
    --workload-identity-pool=$WIF_POOL_ID \
    --format="value(name)")

echo "📋 Workload Identity Provider 完整名稱: $WIF_PROVIDER_FULL_NAME"

# 建立 Secret Manager 密鑰
echo "🔐 建立 Secret Manager 密鑰..."
secrets=(
    "LARAVEL_APP_KEY"
    "LARAVEL_DB_PASSWORD"
)

for secret in "${secrets[@]}"; do
    if ! gcloud secrets describe $secret --quiet 2>/dev/null; then
        gcloud secrets create $secret \
            --replication-policy="automatic" \
            --labels="project=inventory-system" \
            --quiet
        echo "   ✅ 密鑰 $secret 建立完成"
    else
        echo "   ✅ 密鑰 $secret 已存在"
    fi
done

# 為服務帳號添加 Secret Manager 權限
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$DEPLOY_SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet > /dev/null 2>&1

# 生成 Laravel APP_KEY
echo "🔑 生成 Laravel APP_KEY..."
LARAVEL_APP_KEY=$(cd inventory-api && php artisan key:generate --show)

echo ""
echo "🎉 GCP 基礎設施部署完成！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 GitHub Repository Secrets 設定"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "請在 GitHub Repository Settings > Secrets and variables > Actions 中設定："
echo ""
echo "🔹 GCP_PROJECT_ID:"
echo "   $PROJECT_ID"
echo ""
echo "🔹 GCS_BUCKET:"
echo "   $BUCKET_NAME"
echo ""
echo "🔹 CLOUD_SQL_CONNECTION_NAME:"
echo "   $PROJECT_ID:$REGION:$INSTANCE_NAME"
echo ""
echo "🔹 GCP_WORKLOAD_IDENTITY_PROVIDER:"
echo "   $WIF_PROVIDER_FULL_NAME"
echo ""
echo "🔹 GCP_SERVICE_ACCOUNT:"
echo "   $DEPLOY_SA_EMAIL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Secret Manager 密鑰設定"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "請在 GCP Console > Secret Manager 中設定以下密鑰的值："
echo ""
echo "🔸 LARAVEL_APP_KEY:"
echo "   $LARAVEL_APP_KEY"
echo ""
echo "🔸 LARAVEL_DB_PASSWORD:"
echo "   <請設定一個強密碼>"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 部署步驟"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 在 GitHub 中設定上述 Secrets"
echo "2. 在 Secret Manager 中設定密鑰值"
echo "3. 推送程式碼到 master 分支觸發自動部署"
echo ""
echo "📖 詳細步驟請參考：GCP_Deployment_Plan.md"
echo ""
echo "✨ 祝您部署順利！" 