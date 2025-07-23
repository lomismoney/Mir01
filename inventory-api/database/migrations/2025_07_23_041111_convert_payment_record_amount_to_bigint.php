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
        Schema::table('payment_records', function (Blueprint $table) {
            // 先新增 bigint 欄位
            $table->bigInteger('amount_in_cents')->default(0)->after('amount');
        });

        // 將現有的 decimal 資料轉換為 bigint（元轉分）
        DB::statement('UPDATE payment_records SET amount_in_cents = CAST(amount * 100 AS SIGNED)');

        Schema::table('payment_records', function (Blueprint $table) {
            // 刪除舊的 decimal 欄位
            $table->dropColumn('amount');
        });

        Schema::table('payment_records', function (Blueprint $table) {
            // 重新命名欄位為 amount
            $table->renameColumn('amount_in_cents', 'amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_records', function (Blueprint $table) {
            // 先新增 decimal 欄位
            $table->decimal('amount_in_decimal', 10, 2)->default(0)->after('amount');
        });

        // 將 bigint 資料轉換回 decimal（分轉元）
        DB::statement('UPDATE payment_records SET amount_in_decimal = amount / 100');

        Schema::table('payment_records', function (Blueprint $table) {
            // 刪除 bigint 欄位
            $table->dropColumn('amount');
        });

        Schema::table('payment_records', function (Blueprint $table) {
            // 重新命名欄位
            $table->renameColumn('amount_in_decimal', 'amount');
        });
    }
};
