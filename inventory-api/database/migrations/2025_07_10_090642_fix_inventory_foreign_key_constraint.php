<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 修正庫存表的外鍵約束
     * 
     * 將 product_variant_id 的外鍵約束從 cascade 改為 restrict
     * 這樣可以防止在刪除變體時自動刪除庫存記錄，
     * 保留歷史數據用於審計和追蹤
     */
    public function up(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // 先移除現有的外鍵約束
            $table->dropForeign(['product_variant_id']);
            
            // 修改欄位為可以為 null
            $table->unsignedBigInteger('product_variant_id')->nullable()->change();
            
            // 重新創建外鍵約束，使用 set null 保留歷史記錄
            $table->foreign('product_variant_id')
                  ->references('id')
                  ->on('product_variants')
                  ->onDelete('set null')
                  ->comment('變體刪除時保留庫存記錄作為歷史數據');
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // 移除 set null 約束
            $table->dropForeign(['product_variant_id']);
            
            // 恢復欄位為不可為 null
            $table->unsignedBigInteger('product_variant_id')->nullable(false)->change();
            
            // 恢復原本的 cascade 約束
            $table->foreign('product_variant_id')
                  ->references('id')
                  ->on('product_variants')
                  ->onDelete('cascade');
        });
    }
};
