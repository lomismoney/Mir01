<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 建立 products 資料表，用於存儲 SPU (Standard Product Unit) 級別的商品資訊
     * SPU 是商品的標準化產品單元，例如 "Aeron 人體工學椅"
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('SPU 名稱，例如 "Aeron 人體工學椅"'); // SPU 名稱，例如 "Aeron 人體工學椅"
            $table->text('description')->nullable()->comment('商品描述');
            $table->unsignedBigInteger('category_id')
                  ->nullable()
                  ->comment('分類ID，將在後續遷移中添加外鍵約束');
            // 我們也可以在這裡加入 brand_id, is_active 等 SPU 級別的欄位
            $table->timestamps();
        });
    }

    /**
     * 回滾遷移
     * 刪除 products 資料表
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
