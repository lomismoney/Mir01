<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 建立 product_attribute 樞紐表，記錄 SPU 與屬性的關聯關係
     * 例如：記錄「一件 T-shirt」擁有「顏色」和「尺寸」這兩個屬性
     */
    public function up(): void
    {
        // 這張表記錄了「一件 T-shirt」擁有「顏色」和「尺寸」這兩個屬性
        Schema::create('product_attribute', function (Blueprint $table) {
            $table->foreignId('product_id')
                  ->constrained()
                  ->onDelete('cascade')
                  ->comment('關聯的商品ID，外鍵約束到 products 表');
            $table->foreignId('attribute_id')
                  ->constrained()
                  ->onDelete('cascade')
                  ->comment('關聯的屬性ID，外鍵約束到 attributes 表');
            $table->primary(['product_id', 'attribute_id']);
        });
    }

    /**
     * 回滾遷移
     * 刪除 product_attribute 樞紐表
     */
    public function down(): void
    {
        Schema::dropIfExists('product_attribute');
    }
};
