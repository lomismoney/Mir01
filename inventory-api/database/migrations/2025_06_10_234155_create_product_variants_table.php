<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 建立 product_variants 資料表，用於存儲 SKU 級別的商品變體資訊
     * SKU 是庫存管理的最小單位，一個 SPU 可以有多個 SKU 變體
     */
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                  ->constrained()
                  ->onDelete('cascade')
                  ->comment('關聯的商品ID，外鍵約束到 products 表');
            $table->string('sku')
                  ->unique()
                  ->comment('庫存單位編號，必須唯一'); // SKU 是庫存管理的最小單位，必須唯一
            $table->decimal('price', 10, 2)
                  ->comment('商品變體價格，與 SKU 掛鉤'); // 價格與 SKU 掛鉤
            $table->timestamps();
        });
    }

    /**
     * 回滾遷移
     * 刪除 product_variants 資料表
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
