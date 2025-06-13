<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 將 store_id 欄位添加回 inventories 表，以支援多門市庫存管理
     */
    public function up(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // 檢查 store_id 欄位是否已存在
            if (!Schema::hasColumn('inventories', 'store_id')) {
                $table->foreignId('store_id')
                      ->after('product_variant_id')
                      ->constrained()
                      ->onDelete('cascade')
                      ->comment('所屬門市ID');
            }
            
            // 先刪除外鍵約束
            $table->dropForeign(['product_variant_id']);
            
            // 更新唯一約束，每個SKU在每個門市只能有一條庫存記錄
            $table->dropUnique(['product_variant_id']);
            $table->unique(['product_variant_id', 'store_id']);
            
            // 重新創建外鍵約束
            $table->foreign('product_variant_id')
                  ->references('id')
                  ->on('product_variants')
                  ->onDelete('cascade');
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // 先刪除外鍵約束
            $table->dropForeign(['product_variant_id']);
            
            // 移除唯一約束
            $table->dropUnique(['product_variant_id', 'store_id']);
            $table->unique(['product_variant_id']);
            
            // 重新創建外鍵約束
            $table->foreign('product_variant_id')
                  ->references('id')
                  ->on('product_variants')
                  ->onDelete('cascade');
            
            // 移除 store_id 欄位
            if (Schema::hasColumn('inventories', 'store_id')) {
                $table->dropForeign(['store_id']);
                $table->dropColumn('store_id');
            }
        });
    }
};
