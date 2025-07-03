<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 為 product_variants 表新增成本相關欄位
     */
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('cost_price', 10, 2)->default(0)->after('price')->comment('商品單項成本價格（不含運費）');
            $table->decimal('average_cost', 10, 2)->default(0)->after('cost_price')->comment('平均成本價格（含運費攤銷）');
            $table->integer('total_purchased_quantity')->default(0)->after('average_cost')->comment('累計進貨數量，用於平均成本計算');
            $table->decimal('total_cost_amount', 12, 2)->default(0)->after('total_purchased_quantity')->comment('累計成本金額（含運費攤銷），用於平均成本計算');
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['cost_price', 'average_cost', 'total_purchased_quantity', 'total_cost_amount']);
        });
    }
};
