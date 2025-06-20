<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 創建 refunds 表 - 主退款單
     * 
     * 設計說明：
     * 1. 支援品項級別的退款管理
     * 2. 記錄退款原因和處理選項
     * 3. 與訂單和操作員建立外鍵關聯
     * 4. 支援庫存回補決策記錄
     */
    public function up(): void
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            
            // 🔗 關聯欄位
            $table->foreignId('order_id')
                  ->constrained('orders')
                  ->onDelete('cascade')
                  ->comment('關聯的訂單 ID');
            
            $table->foreignId('creator_id')
                  ->constrained('users')
                  ->onDelete('restrict')
                  ->comment('創建退款的操作員 ID');
            
            // 💰 金額欄位
            $table->decimal('total_refund_amount', 10, 2)
                  ->default(0)
                  ->comment('本次退款總金額');
            
            // 📝 退款資訊
            $table->string('reason')
                  ->comment('退款原因');
            
            $table->text('notes')
                  ->nullable()
                  ->comment('退款備註');
            
            // 📦 庫存處理
            $table->boolean('should_restock')
                  ->default(true)
                  ->comment('是否將退貨商品加回庫存');
            
            // ⏰ 時間戳記
            $table->timestamps();
            
            // 🗂️ 索引優化
            $table->index(['order_id', 'created_at'], 'idx_refunds_order_created');
            $table->index('creator_id', 'idx_refunds_creator');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
