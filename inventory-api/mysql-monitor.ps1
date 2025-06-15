# MySQL 服務監控和自動重啟腳本
# 解決 Docker MySQL 容器自動關閉問題

param(
    [int]$CheckInterval = 60,  # 檢查間隔（秒）
    [string]$ContainerName = "inventory-mysql"
)

Write-Host "🔥 MySQL 服務監控器啟動中..." -ForegroundColor Green
Write-Host "📊 監控容器: $ContainerName" -ForegroundColor Yellow
Write-Host "⏰ 檢查間隔: $CheckInterval 秒" -ForegroundColor Yellow
Write-Host "🚀 按 Ctrl+C 停止監控" -ForegroundColor Cyan
Write-Host ("-" * 50)

# 日誌函數
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

# 檢查 Docker 是否運行
function Test-DockerRunning {
    try {
        docker version *>$null
        return $true
    } catch {
        return $false
    }
}

# 檢查容器狀態
function Get-ContainerStatus {
    param([string]$Name)
    try {
        $status = docker inspect --format='{{.State.Status}}' $Name 2>$null
        return $status
    } catch {
        return $null
    }
}

# 檢查容器健康狀態
function Get-ContainerHealth {
    param([string]$Name)
    try {
        $health = docker inspect --format='{{.State.Health.Status}}' $Name 2>$null
        return $health
    } catch {
        return $null
    }
}

# 重啟服務
function Restart-DockerServices {
    Write-Log "🔄 重新啟動 Docker 服務..." "WARN"
    try {
        # 停止所有服務
        docker-compose down
        Start-Sleep -Seconds 5
        
        # 清理懸空的容器和網絡
        docker system prune -f
        
        # 重新啟動服務
        docker-compose up -d
        
        Write-Log "✅ Docker 服務重啟完成" "SUCCESS"
        return $true
    } catch {
        Write-Log "❌ Docker 服務重啟失敗: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# 主監控循環
try {
    while ($true) {
        # 檢查 Docker 是否運行
        if (-not (Test-DockerRunning)) {
            Write-Log "❌ Docker 未運行，請啟動 Docker Desktop" "ERROR"
            Start-Sleep -Seconds $CheckInterval
            continue
        }

        # 檢查容器狀態
        $containerStatus = Get-ContainerStatus -Name $ContainerName
        $containerHealth = Get-ContainerHealth -Name $ContainerName
        
        if ($containerStatus -eq $null) {
            Write-Log "⚠️  容器 $ContainerName 不存在，嘗試重啟服務..." "WARN"
            Restart-DockerServices
        } elseif ($containerStatus -ne "running") {
            Write-Log "⚠️  容器 $ContainerName 狀態: $containerStatus，嘗試重啟..." "WARN"
            Restart-DockerServices
        } elseif ($containerHealth -eq "unhealthy") {
            Write-Log "⚠️  容器 $ContainerName 健康檢查失敗，嘗試重啟..." "WARN"
            Restart-DockerServices
        } else {
            Write-Log "✅ 容器 $ContainerName 運行正常 - 狀態: $containerStatus, 健康: $containerHealth" "SUCCESS"
        }

        # 顯示容器資源使用情況
        try {
            $stats = docker stats $ContainerName --no-stream --format "table {{.MemUsage}}\t{{.CPUPerc}}" 2>$null
            if ($stats) {
                Write-Log "📊 資源使用: $($stats | Select-Object -Skip 1)" "INFO"
            }
        } catch {
            # 忽略統計錯誤
        }

        Start-Sleep -Seconds $CheckInterval
    }
} catch [System.Management.Automation.BreakException] {
    Write-Log "🛑 監控器已停止" "INFO"
} catch {
    Write-Log "❌ 監控器發生錯誤: $($_.Exception.Message)" "ERROR"
} 