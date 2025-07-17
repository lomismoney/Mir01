<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 修改 order_id 的外鍵約束行為
     * 從 onDelete('set null') 改為 onDelete('restrict')
     * 這樣可以防止在有關聯庫存轉移的情況下直接刪除訂單
     * 確保應用層邏輯先處理庫存轉移的取消
     */
    public function up(): void
    {
        Schema::table('inventory_transfers', function (Blueprint $table) {
            // 先刪除現有的外鍵約束
            $table->dropForeign(['order_id']);
            
            // 重新添加外鍵約束，使用 restrict 行為
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * 恢復原本的 onDelete('set null') 行為
     */
    public function down(): void
    {
        Schema::table('inventory_transfers', function (Blueprint $table) {
            // 先刪除現有的外鍵約束
            $table->dropForeign(['order_id']);
            
            // 恢復原本的外鍵約束行為
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('set null');
        });
    }
};
