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
        Schema::table('order_items', function (Blueprint $table) {
            // 2.1 讓 product_variant_id 可以為空，用於區分標準品與訂製品
            $table->unsignedBigInteger('product_variant_id')->nullable()->change();

            // 2.2 新增欄位，儲存訂製資訊（檢查是否已存在）
            if (!Schema::hasColumn('order_items', 'custom_product_name')) {
                $table->string('custom_product_name')->nullable()->after('product_variant_id');
            }
            if (!Schema::hasColumn('order_items', 'custom_specifications')) {
                $table->json('custom_specifications')->nullable()->after('custom_product_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // 移除新增的欄位（如果存在）
            if (Schema::hasColumn('order_items', 'custom_product_name')) {
                $table->dropColumn('custom_product_name');
            }
            if (Schema::hasColumn('order_items', 'custom_specifications')) {
                $table->dropColumn('custom_specifications');
            }
            
            // 還原 product_variant_id 為非空欄位
            $table->unsignedBigInteger('product_variant_id')->nullable(false)->change();
        });
    }
};
