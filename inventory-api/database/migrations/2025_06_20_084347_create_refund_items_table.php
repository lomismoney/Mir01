<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 創建 refund_items 表 - 退款品項明細
     * 
     * 設計說明：
     * 1. 記錄每個退款品項的詳細資訊
     * 2. 支援品項級別的退貨數量管理
     * 3. 計算各品項的退款小計
     * 4. 與主退款單和訂單品項建立關聯
     */
    public function up(): void
    {
        Schema::create('refund_items', function (Blueprint $table) {
            $table->id();
            
            // 🔗 關聯欄位
            $table->foreignId('refund_id')
                  ->constrained('refunds')
                  ->onDelete('cascade')
                  ->comment('關聯的退款單 ID');
            
            $table->foreignId('order_item_id')
                  ->constrained('order_items')
                  ->onDelete('cascade')
                  ->comment('關聯的訂單品項 ID');
            
            // 📦 退貨資訊
            $table->integer('quantity')
                  ->unsigned()
                  ->comment('本次退貨數量');
            
            // 💰 金額計算
            $table->decimal('refund_subtotal', 10, 2)
                  ->comment('本品項的退款小計');
            
            // ⏰ 時間戳記
            $table->timestamps();
            
            // 🗂️ 索引優化
            $table->index('refund_id', 'idx_refund_items_refund');
            $table->index('order_item_id', 'idx_refund_items_order_item');
            
            // 🔒 唯一性約束 - 防止同一訂單品項在同一退款單中重複
            $table->unique(['refund_id', 'order_item_id'], 'uk_refund_items_refund_order_item');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refund_items');
    }
};
