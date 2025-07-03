<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 創建庫存轉移記錄表，用於記錄門市之間的庫存轉移
     */
    public function up(): void
    {
        Schema::create('inventory_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('to_store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained()->onDelete('cascade');
            $table->integer('quantity')->comment('轉移數量');
            $table->string('status')->default('completed')->comment('轉移狀態：pending（待處理），in_transit（運送中），completed（已完成），cancelled（已取消）');
            $table->text('notes')->nullable()->comment('備註說明');
            $table->timestamps();
            
            // 添加索引提升查詢效率
            $table->index('status');
            $table->index('created_at');
            $table->index(['from_store_id', 'to_store_id']);
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transfers');
    }
};
