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
            // 修改 status 欄位為 enum 類型，提供明確的狀態選項
            $table->enum('status', [
                'pending',      // 已下單（等待處理）
                'confirmed',    // 已確認（廠商確認訂單）
                'in_transit',   // 運輸中
                'received',     // 已收貨（但未入庫）
                'completed',    // 已完成（已入庫）
                'cancelled',    // 已取消
                'partially_received' // 部分收貨
            ])->default('pending')->change();
        });

        // 將現有的 'completed' 狀態更新為 'completed'（確保相容性）
        DB::table('purchases')->where('status', 'completed')->update(['status' => 'completed']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            // 回滾到原本的 string 類型
            $table->string('status')->default('completed')->change();
        });
    }
};
