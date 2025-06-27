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
        Schema::table('installation_items', function (Blueprint $table) {
            // 添加商品變體ID欄位
            $table->foreignId('product_variant_id')->nullable()->after('order_item_id')->constrained('product_variants');
            
            // 添加索引
            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('installation_items', function (Blueprint $table) {
            // 移除外鍵約束和欄位
            $table->dropForeign(['product_variant_id']);
            $table->dropColumn('product_variant_id');
        });
    }
};
