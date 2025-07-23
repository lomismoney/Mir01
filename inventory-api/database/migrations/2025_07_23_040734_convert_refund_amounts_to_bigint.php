<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 將 refunds 和 refund_items 表的金額欄位從 decimal 轉換為 bigint
     * 以分為單位儲存，與系統其他部分保持一致
     */
    public function up(): void
    {
        // 1. 轉換 refunds 表的 total_refund_amount
        Schema::table('refunds', function (Blueprint $table) {
            // 先添加新的 bigint 欄位
            $table->bigInteger('total_refund_amount_new')->default(0)->after('total_refund_amount');
        });

        // 轉換現有數據（元轉分）
        DB::statement('UPDATE refunds SET total_refund_amount_new = ROUND(total_refund_amount * 100)');

        // 刪除舊欄位並重命名新欄位
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropColumn('total_refund_amount');
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->renameColumn('total_refund_amount_new', 'total_refund_amount');
        });

        // 2. 轉換 refund_items 表的 refund_subtotal
        Schema::table('refund_items', function (Blueprint $table) {
            // 先添加新的 bigint 欄位
            $table->bigInteger('refund_subtotal_new')->default(0)->after('refund_subtotal');
        });

        // 轉換現有數據（元轉分）
        DB::statement('UPDATE refund_items SET refund_subtotal_new = ROUND(refund_subtotal * 100)');

        // 刪除舊欄位並重命名新欄位
        Schema::table('refund_items', function (Blueprint $table) {
            $table->dropColumn('refund_subtotal');
        });

        Schema::table('refund_items', function (Blueprint $table) {
            $table->renameColumn('refund_subtotal_new', 'refund_subtotal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. 還原 refunds 表的 total_refund_amount
        Schema::table('refunds', function (Blueprint $table) {
            // 先添加舊的 decimal 欄位
            $table->decimal('total_refund_amount_old', 10, 2)->default(0)->after('total_refund_amount');
        });

        // 轉換數據（分轉元）
        DB::statement('UPDATE refunds SET total_refund_amount_old = total_refund_amount / 100');

        // 刪除新欄位並重命名舊欄位
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropColumn('total_refund_amount');
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->renameColumn('total_refund_amount_old', 'total_refund_amount');
        });

        // 2. 還原 refund_items 表的 refund_subtotal
        Schema::table('refund_items', function (Blueprint $table) {
            // 先添加舊的 decimal 欄位
            $table->decimal('refund_subtotal_old', 10, 2)->default(0)->after('refund_subtotal');
        });

        // 轉換數據（分轉元）
        DB::statement('UPDATE refund_items SET refund_subtotal_old = refund_subtotal / 100');

        // 刪除新欄位並重命名舊欄位
        Schema::table('refund_items', function (Blueprint $table) {
            $table->dropColumn('refund_subtotal');
        });

        Schema::table('refund_items', function (Blueprint $table) {
            $table->renameColumn('refund_subtotal_old', 'refund_subtotal');
        });
    }
};