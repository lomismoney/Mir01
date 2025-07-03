<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 為 order_items 表的 status 欄位添加預設值「待處理」
     * 這確保新創建的訂單項目都有一個明確的初始狀態
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // 修改 status 欄位，添加預設值
            $table->string('status')->default('待處理')->change();
        });
    }

    /**
     * Reverse the migrations.
     * 
     * 移除預設值，恢復原始狀態
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // 移除預設值
            $table->string('status')->default(null)->change();
        });
    }
};
