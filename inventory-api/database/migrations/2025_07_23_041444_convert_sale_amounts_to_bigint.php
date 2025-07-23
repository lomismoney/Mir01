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
        // 轉換 sales 表的 total_amount
        Schema::table('sales', function (Blueprint $table) {
            // 添加臨時欄位
            $table->bigInteger('total_amount_cents')->default(0)->after('total_amount');
        });

        // 將元轉換為分（乘以 100）
        DB::statement('UPDATE sales SET total_amount_cents = ROUND(total_amount * 100)');

        Schema::table('sales', function (Blueprint $table) {
            // 刪除原欄位
            $table->dropColumn('total_amount');
        });

        Schema::table('sales', function (Blueprint $table) {
            // 重命名臨時欄位
            $table->renameColumn('total_amount_cents', 'total_amount');
        });

        // 轉換 sale_items 表的 unit_price
        Schema::table('sale_items', function (Blueprint $table) {
            // 添加臨時欄位
            $table->bigInteger('unit_price_cents')->default(0)->after('unit_price');
        });

        // 將元轉換為分（乘以 100）
        DB::statement('UPDATE sale_items SET unit_price_cents = ROUND(unit_price * 100)');

        Schema::table('sale_items', function (Blueprint $table) {
            // 刪除原欄位
            $table->dropColumn('unit_price');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            // 重命名臨時欄位
            $table->renameColumn('unit_price_cents', 'unit_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 反向轉換 sales 表的 total_amount
        Schema::table('sales', function (Blueprint $table) {
            // 添加臨時欄位
            $table->decimal('total_amount_decimal', 10, 2)->default(0)->after('total_amount');
        });

        // 將分轉換為元（除以 100）
        DB::statement('UPDATE sales SET total_amount_decimal = total_amount / 100');

        Schema::table('sales', function (Blueprint $table) {
            // 刪除原欄位
            $table->dropColumn('total_amount');
        });

        Schema::table('sales', function (Blueprint $table) {
            // 重命名臨時欄位
            $table->renameColumn('total_amount_decimal', 'total_amount');
        });

        // 反向轉換 sale_items 表的 unit_price
        Schema::table('sale_items', function (Blueprint $table) {
            // 添加臨時欄位
            $table->decimal('unit_price_decimal', 10, 2)->default(0)->after('unit_price');
        });

        // 將分轉換為元（除以 100）
        DB::statement('UPDATE sale_items SET unit_price_decimal = unit_price / 100');

        Schema::table('sale_items', function (Blueprint $table) {
            // 刪除原欄位
            $table->dropColumn('unit_price');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            // 重命名臨時欄位
            $table->renameColumn('unit_price_decimal', 'unit_price');
        });
    }
};
