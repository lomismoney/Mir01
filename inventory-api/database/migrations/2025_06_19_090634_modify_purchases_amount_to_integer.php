<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            // 先將資料庫中的浮點數轉換為整數（乘以 100）
            DB::statement('UPDATE purchases SET shipping_cost = shipping_cost * 100');
            DB::statement('UPDATE purchases SET total_amount = total_amount * 100');

            // 修改欄位類型為 INTEGER
            $table->integer('shipping_cost')->default(0)->change();
            $table->integer('total_amount')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            // 修改欄位類型回 decimal
            $table->decimal('shipping_cost', 10, 2)->change();
            $table->decimal('total_amount', 10, 2)->change();

            // 將整數轉換回浮點數（除以 100）
            DB::statement('UPDATE purchases SET shipping_cost = shipping_cost / 100');
            DB::statement('UPDATE purchases SET total_amount = total_amount / 100');
        });
    }
};
