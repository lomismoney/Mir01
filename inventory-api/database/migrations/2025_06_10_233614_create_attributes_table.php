<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 建立 attributes 資料表，用於存儲商品屬性（如顏色、尺寸等）
     */
    public function up(): void
    {
        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique()->comment('屬性名稱，例如：顏色、尺寸'); // 例如："顏色", "尺寸"
            $table->timestamps();
        });
    }

    /**
     * 回滾遷移
     * 刪除 attributes 資料表
     */
    public function down(): void
    {
        Schema::dropIfExists('attributes');
    }
};
