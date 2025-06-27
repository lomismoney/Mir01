# 備份腳本 - 在 API Platform 遷移前執行
# PowerShell 版本

Write-Host "🔄 開始備份程序..." -ForegroundColor Green

# 1. 創建備份標籤
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$TAG_NAME = "pre-api-platform-$DATE"

Write-Host "📌 創建 Git 標籤: $TAG_NAME" -ForegroundColor Yellow
git tag -a $TAG_NAME -m "Backup before API Platform migration"

# 2. 備份 Scribe 配置
Write-Host "📁 備份 Scribe 配置..." -ForegroundColor Yellow
Copy-Item "config/scribe.php" "config/scribe.php.backup-$DATE"

# 3. 備份 Scribe 生成的文檔
if (Test-Path "storage/app/private/scribe") {
    Write-Host "📁 備份 Scribe 文檔..." -ForegroundColor Yellow
    Copy-Item -Path "storage/app/private/scribe" -Destination "storage/app/private/scribe.backup-$DATE" -Recurse
}

# 4. 備份現有路由列表
Write-Host "📝 備份路由列表..." -ForegroundColor Yellow
php artisan route:list | Out-File "routes-backup-$DATE.txt"

# 5. 建立配置備份
Write-Host "📁 備份關鍵配置文件..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "backup/$DATE" -Force | Out-Null
Copy-Item "config/auth.php" "backup/$DATE/"
Copy-Item "config/sanctum.php" "backup/$DATE/"
Copy-Item "routes/api.php" "backup/$DATE/"

Write-Host "✅ 備份完成！" -ForegroundColor Green
Write-Host "📍 備份標籤: $TAG_NAME" -ForegroundColor Cyan
Write-Host "📂 備份目錄: backup/$DATE/" -ForegroundColor Cyan 