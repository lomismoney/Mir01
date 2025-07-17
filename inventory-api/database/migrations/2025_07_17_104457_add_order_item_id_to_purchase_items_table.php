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
        Schema::table('purchase_items', function (Blueprint $table) {
            // 新增與訂單項目的關聯
            $table->foreignId('order_item_id')
                  ->nullable()
                  ->after('allocated_shipping_cost')
                  ->constrained('order_items')
                  ->onDelete('set null')
                  ->comment('關聯的訂單項目 - 用於追蹤進貨單與預訂訂單的關聯');
            
            // 新增索引以提升查詢效能
            $table->index(['product_variant_id', 'order_item_id'], 'idx_variant_order_item');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            // 移除索引
            $table->dropIndex('idx_variant_order_item');
            
            // 移除外鍵約束和欄位
            $table->dropConstrainedForeignId('order_item_id');
        });
    }
};