<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 為 purchases 表新增運費欄位
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('shipping_cost', 10, 2)->default(0)->after('total_amount')->comment('總運費成本');
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn('shipping_cost');
        });
    }
};
