<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * SQLite兼容性修補程式 - 僅在測試環境執行
     * 
     * SQLite不支持許多MySQL特性，此遷移提供最小化的兼容性支持
     * 主要用於測試和OpenAPI生成環境
     */
    public function up(): void
    {
        // 只在SQLite環境下執行
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        // 只在測試環境執行
        if (app()->environment() !== 'testing') {
            return;
        }

        echo "🔧 執行SQLite測試環境兼容性修補...\n";

        // 為測試環境添加必要的索引（如果不存在）
        $this->addTestingIndexes();

        echo "✅ SQLite測試環境兼容性修補完成\n";
    }

    /**
     * 添加測試環境需要的索引
     */
    private function addTestingIndexes(): void
    {
        try {
            // 檢查並添加產品相關索引
            $this->addIndexIfNotExists('products', ['name']);
            // 移除 products.sku 索引，因為 products 表沒有 sku 欄位（SKU 在 product_variants 表中）
            $this->addIndexIfNotExists('product_variants', ['sku']);
            
            // 檢查並添加訂單相關索引
            $this->addIndexIfNotExists('orders', ['order_number']);
            $this->addIndexIfNotExists('orders', ['customer_id']);
            
            echo "✅ 測試索引添加完成\n";
        } catch (Exception $e) {
            echo "⚠️ 索引添加警告: " . $e->getMessage() . "\n";
        }
    }

    /**
     * 如果索引不存在則添加
     */
    private function addIndexIfNotExists(string $table, array $columns): void
    {
        $indexName = $table . '_' . implode('_', $columns) . '_index';
        
        // 檢查索引是否存在
        $exists = DB::select("SELECT name FROM sqlite_master WHERE type='index' AND name=?", [$indexName]);
        
        if (empty($exists)) {
            $columnList = implode(',', array_map(function($col) {
                return "`{$col}`";
            }, $columns));
            
            DB::statement("CREATE INDEX `{$indexName}` ON `{$table}` ({$columnList})");
            echo "  ✓ 添加索引: {$indexName}\n";
        }
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        // 在測試環境中，通常使用 :memory: 數據庫，無需特別清理
        if (DB::getDriverName() === 'sqlite' && app()->environment() === 'testing') {
            echo "🔄 SQLite測試環境遷移回滾\n";
        }
    }
};