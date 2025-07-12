<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 添加部分履行功能支援
     * 
     * 允許訂單項目分批履行，記錄已履行數量
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // 添加已履行數量欄位
            $table->unsignedInteger('fulfilled_quantity')
                  ->default(0)
                  ->after('quantity')
                  ->comment('已履行數量（已進貨/製作完成的數量）');
            
            // 添加索引以優化查詢部分履行的訂單項目
            $table->index(['is_fulfilled', 'fulfilled_quantity'], 'idx_order_items_fulfillment_status');
        });

        // 更新現有資料：已履行的項目設定 fulfilled_quantity = quantity
        DB::statement('UPDATE order_items SET fulfilled_quantity = quantity WHERE is_fulfilled = 1');
        
        // 更新現貨商品的履行數量（現貨商品總是完全履行）
        DB::statement('UPDATE order_items SET fulfilled_quantity = quantity WHERE is_stocked_sale = 1');
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_fulfillment_status');
            $table->dropColumn('fulfilled_quantity');
        });
    }
};