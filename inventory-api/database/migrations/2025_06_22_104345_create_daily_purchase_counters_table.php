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
        Schema::create('daily_purchase_counters', function (Blueprint $table) {
            // 主鍵：日期格式，例如 "2025-06-22"
            $table->date('date')->primary();
            
            // 該日最後使用的序號
            $table->unsignedInteger('last_sequence')->default(0);
            
            // 時間戳記
            $table->timestamps();
            
            // 添加註解
            $table->comment('追蹤每日進貨單號的序號計數器');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_purchase_counters');
    }
};
