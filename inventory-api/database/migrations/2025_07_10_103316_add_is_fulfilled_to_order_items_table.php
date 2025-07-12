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
            // 新增履行狀態欄位
            $table->boolean('is_fulfilled')
                  ->default(false)
                  ->after('purchase_item_id')
                  ->comment('商品是否已完成進貨/製作 - 用於決定退貨時是否需要入庫');
            
            // 新增履行日期欄位
            $table->timestamp('fulfilled_at')
                  ->nullable()
                  ->after('is_fulfilled')
                  ->comment('商品完成進貨/製作的時間');
            
            // 新增索引以提升查詢效能
            $table->index(['is_backorder', 'is_fulfilled'], 'idx_backorder_fulfilled');
            $table->index(['is_fulfilled', 'fulfilled_at'], 'idx_fulfilled_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // 移除索引
            $table->dropIndex('idx_backorder_fulfilled');
            $table->dropIndex('idx_fulfilled_date');
            
            // 移除欄位
            $table->dropColumn('is_fulfilled');
            $table->dropColumn('fulfilled_at');
        });
    }
};
