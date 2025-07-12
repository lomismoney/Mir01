<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // 添加統一的項目類型欄位
            $table->enum('item_type', ['stock', 'backorder', 'custom'])
                  ->default('stock')
                  ->after('id')
                  ->comment('商品類型：stock=現貨，backorder=預訂，custom=訂製');
            
            // 添加索引以提高查詢效能
            $table->index('item_type', 'idx_order_items_item_type');
            
            // 添加複合索引用於類型和履行狀態查詢
            $table->index(['item_type', 'is_fulfilled'], 'idx_order_items_type_fulfilled_new');
        });
        
        // 數據遷移：根據現有布爾欄位設定新的item_type值
        DB::statement("
            UPDATE order_items 
            SET item_type = CASE 
                WHEN is_backorder = 1 THEN 'backorder'
                WHEN is_stocked_sale = 0 AND is_backorder = 0 AND product_variant_id IS NULL THEN 'custom'
                ELSE 'stock'
            END
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_item_type');
            $table->dropIndex('idx_order_items_type_fulfilled_new');
            $table->dropColumn('item_type');
        });
    }
};
