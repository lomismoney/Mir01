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
        Schema::create('monthly_order_counters', function (Blueprint $table) {
            // 主鍵：年月格式，例如 "2025-06"
            $table->char('year_month', 7)->primary();
            
            // 該月最後使用的序號
            $table->unsignedInteger('last_sequence')->default(0);
            
            // 時間戳記
            $table->timestamps();
            
            // 添加註解
            $table->comment('追蹤每月訂單編號的序號計數器');
        });
        
        // 註：orders 表的 order_number 欄位已經有唯一索引，無需重複創建
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 刪除 monthly_order_counters 表
        Schema::dropIfExists('monthly_order_counters');
    }
};
