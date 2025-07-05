#!/bin/bash
# 庫存管理系統技術債務自動化測量腳本
# 用於持續監控和準確測量技術債務狀況

echo "=== 庫存管理系統技術債務測量報告 ==="
echo "測量時間: $(date)"
echo "執行目錄: $(pwd)"
echo

# 檢查必要目錄
if [ ! -d "inventory-client" ] || [ ! -d "inventory-api" ]; then
    echo "❌ 錯誤: 請在專案根目錄執行此腳本"
    echo "   需要存在 inventory-client/ 和 inventory-api/ 目錄"
    exit 1
fi

echo "📊 === 前端技術債務統計 === 📊"
cd inventory-client

# 前端 any 使用統計
FRONTEND_CORE_ANY=$(grep -r ': any\|as any\|any\[\]' src/ --include="*.ts" --include="*.tsx" --exclude-dir="__tests__" 2>/dev/null | wc -l)
FRONTEND_TOTAL_ANY=$(grep -r ': any\|as any\|any\[\]' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
FRONTEND_TEST_ANY=$((FRONTEND_TOTAL_ANY - FRONTEND_CORE_ANY))

echo "  ✅ 源代碼 any 使用 (主要修復目標): $FRONTEND_CORE_ANY 處"
echo "  📊 包含測試檔案 any 使用: $FRONTEND_TOTAL_ANY 處"
echo "  🧪 僅測試檔案 any 使用: $FRONTEND_TEST_ANY 處"

# 前端檔案統計
FRONTEND_TS_FILES=$(find src/ -name "*.ts" -o -name "*.tsx" | wc -l)
FRONTEND_TEST_FILES=$(find src/ -path "*/__tests__/*" -name "*.ts" -o -path "*/__tests__/*" -name "*.tsx" | wc -l)
FRONTEND_CORE_FILES=$((FRONTEND_TS_FILES - FRONTEND_TEST_FILES))

echo "  📁 總 TypeScript 檔案: $FRONTEND_TS_FILES 檔案"
echo "  📁 源代碼檔案: $FRONTEND_CORE_FILES 檔案"
echo "  📁 測試檔案: $FRONTEND_TEST_FILES 檔案"

# 計算 any 使用密度
if [ $FRONTEND_CORE_FILES -gt 0 ]; then
    FRONTEND_ANY_DENSITY=$(awk "BEGIN {printf \"%.1f\", $FRONTEND_CORE_ANY/$FRONTEND_CORE_FILES}")
    echo "  📈 any 使用密度: $FRONTEND_ANY_DENSITY 處/檔案"
fi

echo
echo "📊 === 後端技術債務統計 === 📊"
cd ../inventory-api

# 後端嚴格類型統計
BACKEND_STRICT_FILES=$(grep -r 'declare(strict_types=1)' app/ 2>/dev/null | wc -l)
BACKEND_TOTAL_FILES=$(find app/ -name "*.php" | wc -l)

echo "  ✅ 嚴格類型檔案: $BACKEND_STRICT_FILES 檔案"
echo "  📁 總 PHP 檔案: $BACKEND_TOTAL_FILES 檔案"

# 計算採用率
if [ $BACKEND_TOTAL_FILES -gt 0 ]; then
    BACKEND_ADOPTION_RATE=$(awk "BEGIN {printf \"%.1f%%\", $BACKEND_STRICT_FILES/$BACKEND_TOTAL_FILES*100}")
    echo "  📈 嚴格類型採用率: $BACKEND_ADOPTION_RATE"
else
    echo "  📈 嚴格類型採用率: 0%"
fi

# 檢查關鍵目錄的嚴格類型狀況
echo "  📂 分目錄嚴格類型統計:"
for dir in Controllers Models Services Policies; do
    if [ -d "app/Http/$dir" ] || [ -d "app/$dir" ]; then
        if [ "$dir" = "Controllers" ]; then
            DIR_PATH="app/Http/Controllers"
        else
            DIR_PATH="app/$dir"
        fi
        
        if [ -d "$DIR_PATH" ]; then
            DIR_STRICT=$(grep -r 'declare(strict_types=1)' "$DIR_PATH" 2>/dev/null | wc -l)
            DIR_TOTAL=$(find "$DIR_PATH" -name "*.php" | wc -l)
            if [ $DIR_TOTAL -gt 0 ]; then
                DIR_RATE=$(awk "BEGIN {printf \"%.1f%%\", $DIR_STRICT/$DIR_TOTAL*100}")
                echo "     $dir: $DIR_STRICT/$DIR_TOTAL ($DIR_RATE)"
            fi
        fi
    fi
done

echo
echo "📊 === API 契約品質統計 === 📊"

# OpenAPI 品質檢查
if [ -f "storage/app/private/scribe/openapi.yaml" ]; then
    OPENAPI_UNKNOWN=$(grep -c "unknown" storage/app/private/scribe/openapi.yaml 2>/dev/null || echo "0")
    echo "  ✅ OpenAPI unknown 類型: $OPENAPI_UNKNOWN 處"
    
    # 檢查 OpenAPI 檔案大小和路由數量
    OPENAPI_SIZE=$(wc -l < storage/app/private/scribe/openapi.yaml)
    OPENAPI_PATHS=$(grep -c "paths:" storage/app/private/scribe/openapi.yaml 2>/dev/null || echo "0")
    echo "  📄 OpenAPI 規格大小: $OPENAPI_SIZE 行"
    echo "  🛣️  API 路由覆蓋: 已生成"
else
    echo "  ❌ OpenAPI 規格檔案不存在"
    echo "     請執行: php artisan scribe:generate"
fi

# 檢查前端 OpenAPI 同步狀況
cd ../inventory-client
if [ -f "openapi.yaml" ]; then
    FRONTEND_OPENAPI_SIZE=$(wc -l < openapi.yaml)
    echo "  🔄 前端 OpenAPI 同步: 已同步 ($FRONTEND_OPENAPI_SIZE 行)"
else
    echo "  ❌ 前端 OpenAPI 檔案不存在"
fi

echo
echo "📊 === 技術債務優先級建議 === 📊"

# 基於數據提供修復建議
echo "  🎯 修復優先級排序:"

if [ $FRONTEND_CORE_ANY -gt 200 ]; then
    echo "     1. 🔥 前端 any 類型修復 (高優先級: $FRONTEND_CORE_ANY 處)"
elif [ $FRONTEND_CORE_ANY -gt 50 ]; then
    echo "     1. ⚡ 前端 any 類型修復 (中優先級: $FRONTEND_CORE_ANY 處)"
else
    echo "     1. ✅ 前端 any 類型狀況良好 ($FRONTEND_CORE_ANY 處)"
fi

if [ $BACKEND_STRICT_FILES -eq 0 ]; then
    echo "     2. 🔥 後端嚴格類型基礎設施 (高優先級: 需從零建立)"
elif [ $BACKEND_TOTAL_FILES -gt 0 ] && [ $(awk "BEGIN {print $BACKEND_STRICT_FILES/$BACKEND_TOTAL_FILES*100}") -lt 50 ]; then
    echo "     2. ⚡ 後端嚴格類型推廣 (中優先級: $BACKEND_ADOPTION_RATE)"
else
    echo "     2. ✅ 後端嚴格類型狀況良好 ($BACKEND_ADOPTION_RATE)"
fi

if [ $OPENAPI_UNKNOWN -gt 0 ]; then
    echo "     3. ⚡ OpenAPI unknown 類型修復 ($OPENAPI_UNKNOWN 處)"
else
    echo "     3. ✅ OpenAPI 契約品質優秀 (0 處 unknown)"
fi

echo
echo "📊 === 預估修復工時 === 📊"

# 工時預估邏輯
FRONTEND_HOURS=$(awk "BEGIN {printf \"%.0f\", $FRONTEND_CORE_ANY * 0.3}")  # 每處 any 約 0.3 小時
BACKEND_HOURS=$(awk "BEGIN {printf \"%.0f\", $BACKEND_TOTAL_FILES * 0.2}") # 每檔案 0.2 小時建立嚴格類型
TOTAL_HOURS=$((FRONTEND_HOURS + BACKEND_HOURS))

echo "  ⏱️  前端 any 修復預估: $FRONTEND_HOURS 小時"
echo "  ⏱️  後端嚴格類型預估: $BACKEND_HOURS 小時"
echo "  ⏱️  總預估工時: $TOTAL_HOURS 小時"

echo
echo "📊 === 測量完成 === 📊"
echo "📄 建議將此報告保存供後續比較"
echo "🔄 建議每週手動執行一次此測量腳本"
echo "⚠️  注意：此為手動測量工具，不會自動執行"

# 返回原始目錄
cd ..