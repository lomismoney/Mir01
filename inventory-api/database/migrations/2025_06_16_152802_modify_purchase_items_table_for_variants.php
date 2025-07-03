<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 修改 purchase_items 表，改為關聯 product_variant 而非 product，並新增成本相關欄位
     */
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            // 先移除舊的外鍵約束
            $table->dropForeign(['product_id']);
            
            // 重新命名 product_id 為 product_variant_id
            $table->renameColumn('product_id', 'product_variant_id');
            
            // 新增成本相關欄位
            $table->decimal('cost_price', 10, 2)->after('unit_price')->comment('商品單項成本價格（不含運費）');
            $table->decimal('allocated_shipping_cost', 10, 2)->default(0)->after('cost_price')->comment('攤銷的運費成本');
            $table->decimal('total_cost_price', 10, 2)->storedAs('cost_price + allocated_shipping_cost')->comment('總成本價格（含攤銷運費）');
        });
        
        // 重新建立外鍵約束到 product_variants 表
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->onDelete('restrict');
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            // 移除外鍵約束
            $table->dropForeign(['product_variant_id']);
            
            // 移除新增的欄位
            $table->dropColumn(['cost_price', 'allocated_shipping_cost', 'total_cost_price']);
            
            // 重新命名回 product_id
            $table->renameColumn('product_variant_id', 'product_id');
        });
        
        // 重新建立到 products 表的外鍵約束
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
        });
    }
};
