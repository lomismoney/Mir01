<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 建立 attribute_value_product_variant 樞紐表，記錄 SKU 與屬性值的關聯關係
     * 例如：記錄「紅色S號T-shirt」這個 SKU 是由「紅色」和「S號」這兩個值組合而成
     */
    public function up(): void
    {
        // 這張表記錄了「紅色S號T-shirt」這個 SKU 是由「紅色」和「S號」這兩個值組合而成
        Schema::create('attribute_value_product_variant', function (Blueprint $table) {
            $table->foreignId('product_variant_id')
                  ->constrained()
                  ->onDelete('cascade')
                  ->comment('關聯的商品變體ID，外鍵約束到 product_variants 表');
            $table->foreignId('attribute_value_id')
                  ->constrained()
                  ->onDelete('cascade')
                  ->comment('關聯的屬性值ID，外鍵約束到 attribute_values 表');
            $table->primary(['product_variant_id', 'attribute_value_id'], 'variant_value_primary');
        });
    }

    /**
     * 回滾遷移
     * 刪除 attribute_value_product_variant 樞紐表
     */
    public function down(): void
    {
        Schema::dropIfExists('attribute_value_product_variant');
    }
};
