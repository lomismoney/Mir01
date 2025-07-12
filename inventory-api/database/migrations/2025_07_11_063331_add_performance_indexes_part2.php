<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Orders 表索引優化
        Schema::table('orders', function (Blueprint $table) {
            // 檢查索引是否已存在，避免重複建立
            if (!$this->indexExists('orders', 'idx_orders_status_composite')) {
                $table->index(['payment_status', 'shipping_status', 'created_at'], 'idx_orders_status_composite');
            }
            
            if (!$this->indexExists('orders', 'idx_orders_customer_date')) {
                $table->index(['customer_id', 'created_at'], 'idx_orders_customer_date');
            }
            
            if (!$this->indexExists('orders', 'idx_orders_amount')) {
                $table->index('grand_total', 'idx_orders_amount');
            }
            
            if (!$this->indexExists('orders', 'idx_orders_updated_at')) {
                $table->index('updated_at', 'idx_orders_updated_at');
            }
        });
        
        // OrderItems 表索引優化
        Schema::table('order_items', function (Blueprint $table) {
            // 產品銷售趨勢分析
            if (!$this->indexExists('order_items', 'idx_order_items_variant_date')) {
                $table->index(['product_variant_id', 'created_at'], 'idx_order_items_variant_date');
            }
            
            // 履行狀態查詢
            if (!$this->indexExists('order_items', 'idx_order_items_fulfillment')) {
                $table->index(['is_fulfilled', 'fulfilled_at'], 'idx_order_items_fulfillment');
            }
            
            // 訂單項目複合查詢
            if (!$this->indexExists('order_items', 'idx_order_items_order_type')) {
                $table->index(['order_id', 'item_type'], 'idx_order_items_order_type');
            }
        });
        
        // ProductVariants 表索引優化
        Schema::table('product_variants', function (Blueprint $table) {
            // 產品價格範圍查詢
            if (!$this->indexExists('product_variants', 'idx_variants_product_price')) {
                $table->index(['product_id', 'price'], 'idx_variants_product_price');
            }
            
            // SKU 查詢優化
            if (!$this->indexExists('product_variants', 'idx_variants_sku')) {
                $table->index('sku', 'idx_variants_sku');
            }
            
            // 活躍狀態查詢（檢查欄位是否存在）
            if (Schema::hasColumn('product_variants', 'is_active') && 
                !$this->indexExists('product_variants', 'idx_variants_active')) {
                $table->index('is_active', 'idx_variants_active');
            }
        });
        
        // Purchases 表索引優化
        Schema::table('purchases', function (Blueprint $table) {
            // 進貨狀態和日期查詢
            if (!$this->indexExists('purchases', 'idx_purchases_status_date')) {
                $table->index(['status', 'created_at'], 'idx_purchases_status_date');
            }
            
            // 供應商進貨查詢（檢查欄位是否存在）
            if (Schema::hasColumn('purchases', 'supplier_id') && 
                !$this->indexExists('purchases', 'idx_purchases_supplier_status')) {
                $table->index(['supplier_id', 'status'], 'idx_purchases_supplier_status');
            }
        });
        
        // Inventories 表額外索引
        Schema::table('inventories', function (Blueprint $table) {
            // 庫存變動追蹤
            if (!$this->indexExists('inventories', 'idx_inventories_updated_at')) {
                $table->index('updated_at', 'idx_inventories_updated_at');
            }
            
            // 成本查詢（檢查欄位是否存在）
            if (Schema::hasColumn('inventories', 'average_cost') && 
                !$this->indexExists('inventories', 'idx_inventories_cost')) {
                $table->index('average_cost', 'idx_inventories_cost');
            }
        });
    }

    /**
     * 檢查索引是否存在（跨資料庫兼容）
     */
    private function indexExists(string $table, string $indexName): bool
    {
        try {
            $driver = \DB::getDriverName();
            
            if ($driver === 'mysql') {
                $indexes = \DB::select("SHOW INDEX FROM {$table}");
                foreach ($indexes as $index) {
                    if ($index->Key_name === $indexName) {
                        return true;
                    }
                }
            } else {
                // SQLite 和其他資料庫：檢查 schema 
                $exists = \DB::select("
                    SELECT name FROM sqlite_master 
                    WHERE type='index' 
                    AND name=?
                ", [$indexName]);
                
                return !empty($exists);
            }
            
            return false;
        } catch (\Exception $e) {
            // 如果檢查失敗，假設索引不存在，讓 Laravel 處理重複索引錯誤
            return false;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_status_composite');
            $table->dropIndex('idx_orders_customer_date');
            $table->dropIndex('idx_orders_amount');
            $table->dropIndex('idx_orders_updated_at');
        });
        
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_variant_date');
            $table->dropIndex('idx_order_items_fulfillment');
            $table->dropIndex('idx_order_items_order_type');
        });
        
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex('idx_variants_product_price');
            $table->dropIndex('idx_variants_sku');
            $table->dropIndex('idx_variants_active');
        });
        
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('idx_purchases_status_date');
            $table->dropIndex('idx_purchases_supplier_status');
        });
        
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropIndex('idx_inventories_updated_at');
            $table->dropIndex('idx_inventories_cost');
        });
    }
};