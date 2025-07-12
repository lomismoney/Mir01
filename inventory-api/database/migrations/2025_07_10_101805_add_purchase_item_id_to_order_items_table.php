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
        Schema::table('order_items', function (Blueprint $table) {
            // 新增與進貨項目的關聯
            $table->foreignId('purchase_item_id')
                  ->nullable()
                  ->after('is_backorder')
                  ->constrained('purchase_items')
                  ->onDelete('set null')
                  ->comment('關聯的進貨項目 - 用於追蹤預訂商品的採購狀態');
            
            // 新增索引以提升查詢效能
            $table->index(['is_backorder', 'purchase_item_id'], 'idx_backorder_purchase');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // 移除索引
            $table->dropIndex('idx_backorder_purchase');
            
            // 移除外鍵約束和欄位
            $table->dropConstrainedForeignId('purchase_item_id');
        });
    }
};
