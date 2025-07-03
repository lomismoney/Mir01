<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 修改 inventories 表結構，從 SPU + Store 架構升級為 SKU 架構
     * 庫存管理應該以 SKU (product_variant) 為最小單位
     */
    public function up(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // 先移除外鍵約束
            $table->dropForeign(['product_id']);
            $table->dropForeign(['store_id']);
            
            // 再移除複合索引
            $table->dropUnique(['product_id', 'store_id']);
            
            // 最後移除欄位
            $table->dropColumn(['product_id', 'store_id']);
            
            // 添加新的 SKU 關聯欄位
            $table->foreignId('product_variant_id')
                  ->unique()
                  ->constrained()
                  ->onDelete('cascade')
                  ->comment('關聯的商品變體ID，與 SKU 一對一關聯');
            
            // 添加庫存預警閾值
            $table->unsignedInteger('low_stock_threshold')
                  ->default(0)
                  ->comment('低庫存預警閾值');
                  
            // 更新 quantity 欄位註釋
            $table->unsignedInteger('quantity')->default(0)->comment('當前庫存數量')->change();
        });
    }

    /**
     * 回滾遷移
     * 將 inventories 表恢復為原本的 SPU + Store 架構
     */
    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // 移除新的約束和欄位
            $table->dropForeign(['product_variant_id']);
            $table->dropUnique(['product_variant_id']);
            $table->dropColumn(['product_variant_id', 'low_stock_threshold']);
            
            // 恢復舊的欄位和約束
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->unique(['product_id', 'store_id']);
            
            // 恢復 quantity 欄位註釋
            $table->unsignedInteger('quantity')->default(0)->change();
        });
    }
};
