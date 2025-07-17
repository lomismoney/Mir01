<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 添加 order_id 欄位到庫存轉移表，建立與訂單的關聯
     */
    public function up(): void
    {
        Schema::table('inventory_transfers', function (Blueprint $table) {
            $table->foreignId('order_id')
                ->nullable()
                ->after('product_variant_id')
                ->constrained('orders')
                ->onDelete('set null')
                ->comment('關聯的訂單ID - 用於追蹤因訂單庫存不足而產生的調貨');
            
            // 添加索引以提升查詢效率
            $table->index('order_id');
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('inventory_transfers', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropColumn('order_id');
        });
    }
};