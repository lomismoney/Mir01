<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 創建庫存交易記錄表，用於記錄所有庫存變動的歷史
     */
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type')->comment('交易類型：addition（添加），reduction（減少），adjustment（調整），transfer_in（轉入），transfer_out（轉出）');
            $table->integer('quantity')->comment('交易數量，可正可負');
            $table->integer('before_quantity')->comment('交易前庫存數量');
            $table->integer('after_quantity')->comment('交易後庫存數量');
            $table->text('notes')->nullable()->comment('備註說明');
            $table->json('metadata')->nullable()->comment('其他元數據，如關聯單據ID等');
            $table->timestamps();
            
            // 添加索引提升查詢效率
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
