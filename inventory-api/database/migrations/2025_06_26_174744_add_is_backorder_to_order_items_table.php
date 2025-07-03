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
            // 🎯 Operation: Precise Tagging - 新增預訂標記欄位
            $table->boolean('is_backorder')->default(false)->after('status')
                  ->comment('是否為預訂商品（因庫存不足而產生）');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // 🎯 回滾操作：移除預訂標記欄位
            $table->dropColumn('is_backorder');
        });
    }
};
