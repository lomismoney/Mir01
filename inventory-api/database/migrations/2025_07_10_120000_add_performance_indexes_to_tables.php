<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 添加效能優化索引
     * 
     * 這些索引基於常見的查詢模式，能顯著提升系統效能
     */
    public function up(): void
    {
        // Orders 表索引優化 - 暫時跳過可能重複的索引
        Schema::table('orders', function (Blueprint $table) {
            // 門市訂單查詢（只有在欄位存在時才添加）
            if (Schema::hasColumn('orders', 'store_id')) {
                try {
                    $table->index('store_id', 'idx_orders_store');
                } catch (\Exception $e) {
                    // 索引已存在，跳過
                }
            }
        });

        // Order items 表索引優化
        Schema::table('order_items', function (Blueprint $table) {
            // 訂單項目狀態查詢
            $table->index('status', 'idx_order_items_status');
            
            // 產品銷售分析
            $table->index('product_variant_id', 'idx_order_items_variant');
            
            // 訂單狀態複合查詢
            $table->index(['order_id', 'status'], 'idx_order_items_order_status');
            
            // 商品類型查詢（用於預訂商品統計）
            $table->index(['is_backorder', 'is_fulfilled'], 'idx_order_items_type_fulfilled');
        });

        // Purchase items 表索引優化
        Schema::table('purchase_items', function (Blueprint $table) {
            // 產品採購記錄查詢
            $table->index('product_variant_id', 'idx_purchase_items_variant');
            
            // 進貨單項目查詢
            $table->index(['purchase_id', 'product_variant_id'], 'idx_purchase_items_purchase_variant');
        });

        // Inventories 表索引優化
        Schema::table('inventories', function (Blueprint $table) {
            // 低庫存預警查詢
            $table->index(['quantity', 'low_stock_threshold'], 'idx_inventories_stock_alert');
            
            // 門市庫存查詢
            $table->index(['store_id', 'quantity'], 'idx_inventories_store_quantity');
            
            // 產品庫存查詢（雖然有唯一索引，但明確定義查詢索引）
            $table->index('product_variant_id', 'idx_inventories_variant');
        });

        // Purchases 表索引優化
        Schema::table('purchases', function (Blueprint $table) {
            // 進貨單狀態查詢
            $table->index('status', 'idx_purchases_status');
            
            // 日期範圍查詢
            $table->index('purchased_at', 'idx_purchases_date');
            
            // 門市進貨查詢
            $table->index(['store_id', 'status'], 'idx_purchases_store_status');
        });

        // Refunds 表索引優化
        Schema::table('refunds', function (Blueprint $table) {
            // 訂單退款查詢
            $table->index('order_id', 'idx_refunds_order');
            
            // 日期範圍查詢
            $table->index('created_at', 'idx_refunds_created_at');
        });

        // Product variants 表索引優化
        Schema::table('product_variants', function (Blueprint $table) {
            // SKU 查詢（雖然有唯一索引，但用於 LIKE 查詢時普通索引更有效）
            $table->index('sku', 'idx_variants_sku');
            
            // 產品變體查詢
            $table->index('product_id', 'idx_variants_product');
            
            // 成本分析查詢（檢查欄位是否存在）
            if (Schema::hasColumn('product_variants', 'cost')) {
                $table->index('cost', 'idx_variants_cost');
            }
        });

        // Customers 表索引優化
        Schema::table('customers', function (Blueprint $table) {
            // 客戶搜尋
            $table->index('phone', 'idx_customers_phone');
            $table->index('email', 'idx_customers_email');
            
            // 全文搜尋（如果資料庫支援）
            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement('ALTER TABLE customers ADD FULLTEXT idx_customers_fulltext (name, phone, email)');
            }
        });
    }

    /**
     * 移除索引
     */
    public function down(): void
    {
        // Orders 表
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_created_at');
            $table->dropIndex('idx_orders_shipping_status');
            $table->dropIndex('idx_orders_payment_status');
            $table->dropIndex('idx_orders_customer_date');
            $table->dropIndex('idx_orders_store');
        });

        // Order items 表
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_status');
            $table->dropIndex('idx_order_items_variant');
            $table->dropIndex('idx_order_items_order_status');
            $table->dropIndex('idx_order_items_type_fulfilled');
        });

        // Purchase items 表
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropIndex('idx_purchase_items_variant');
            $table->dropIndex('idx_purchase_items_purchase_variant');
        });

        // Inventories 表
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropIndex('idx_inventories_stock_alert');
            $table->dropIndex('idx_inventories_store_quantity');
            $table->dropIndex('idx_inventories_variant');
        });

        // Purchases 表
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('idx_purchases_status');
            $table->dropIndex('idx_purchases_date');
            $table->dropIndex('idx_purchases_store_status');
        });

        // Refunds 表
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropIndex('idx_refunds_order');
            $table->dropIndex('idx_refunds_created_at');
        });

        // Product variants 表
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropIndex('idx_variants_sku');
            $table->dropIndex('idx_variants_product');
            
            // 只有當索引存在時才刪除
            if (Schema::hasColumn('product_variants', 'cost')) {
                try {
                    $table->dropIndex('idx_variants_cost');
                } catch (Exception $e) {
                    // 索引不存在時忽略錯誤
                }
            }
        });

        // Customers 表
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex('idx_customers_phone');
            $table->dropIndex('idx_customers_email');
            
            // 移除全文索引
            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement('ALTER TABLE customers DROP INDEX idx_customers_fulltext');
            }
        });
    }
};