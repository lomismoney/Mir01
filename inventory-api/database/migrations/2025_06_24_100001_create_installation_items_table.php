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
        Schema::create('installation_items', function (Blueprint $table) {
            $table->id();
            
            // 關聯鍵
            $table->foreignId('installation_id')->constrained('installations')->cascadeOnDelete();
            $table->foreignId('order_item_id')->nullable()->constrained('order_items');
            
            // 商品資訊（冗餘設計）
            $table->string('product_name');
            $table->string('sku');
            $table->integer('quantity');
            $table->text('specifications')->nullable(); // 安裝規格說明
            
            // 狀態管理
            $table->enum('status', [
                'pending',    // 待安裝
                'completed'   // 已完成
            ])->default('pending');
            
            // 備註
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // 索引
            $table->index('installation_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installation_items');
    }
}; 