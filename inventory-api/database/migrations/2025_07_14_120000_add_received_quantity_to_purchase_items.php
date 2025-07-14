<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移 - 為進貨項目添加收貨數量追蹤
     * 
     * 添加 received_quantity 欄位來支持部分收貨功能
     * 允許記錄每個進貨項目實際收到的數量
     */
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            // 添加已收貨數量欄位
            $table->unsignedInteger('received_quantity')
                  ->default(0)
                  ->after('quantity')
                  ->comment('實際收到的數量（支持部分收貨）');
            
            // 添加收貨狀態追蹤欄位（可選，用於更細緻的狀態管理）
            $table->enum('receipt_status', ['pending', 'partial', 'completed'])
                  ->default('pending')
                  ->after('received_quantity')
                  ->comment('收貨狀態：pending=待收貨, partial=部分收貨, completed=完全收貨');
            
            // 添加索引以優化查詢
            $table->index(['received_quantity', 'quantity'], 'idx_purchase_items_receipt_progress');
            $table->index('receipt_status', 'idx_purchase_items_receipt_status');
        });

        // 為現有資料設定預設值
        // 假設已完成的進貨單項目都是完全收貨的
        // 使用 SQLite 兼容的語法（子查詢方式）
        DB::statement('
            UPDATE purchase_items 
            SET received_quantity = quantity, 
                receipt_status = "completed"
            WHERE purchase_id IN (
                SELECT id 
                FROM purchases 
                WHERE status IN ("completed", "received")
            )
        ');
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            // 移除索引
            $table->dropIndex('idx_purchase_items_receipt_progress');
            $table->dropIndex('idx_purchase_items_receipt_status');
            
            // 移除欄位
            $table->dropColumn('received_quantity');
            $table->dropColumn('receipt_status');
        });
    }
}; 