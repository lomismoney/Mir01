<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 添加預訂商品分配優先級支援欄位
     */
    public function up(): void
    {
        // 1. 為客戶表添加優先級欄位
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('priority_level', ['low', 'normal', 'high', 'vip'])
                  ->default('normal')
                  ->after('total_completed_amount')
                  ->comment('客戶優先級：low=低, normal=普通, high=高, vip=VIP');
                  
            $table->boolean('is_priority_customer')
                  ->default(false)
                  ->after('priority_level')
                  ->comment('是否為優先客戶');
        });

        // 2. 為訂單表添加優先級欄位
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('fulfillment_priority', ['low', 'normal', 'high', 'urgent'])
                  ->default('normal')
                  ->after('estimated_delivery_date')
                  ->comment('履行優先級：low=低, normal=普通, high=高, urgent=緊急');
                  
            $table->date('expected_delivery_date')
                  ->nullable()
                  ->after('fulfillment_priority')
                  ->comment('客戶期望交貨日期');
                  
            $table->text('priority_reason')
                  ->nullable()
                  ->after('expected_delivery_date')
                  ->comment('優先級原因說明');
        });

        // 3. 為訂單項目表添加分配相關欄位
        Schema::table('order_items', function (Blueprint $table) {
            $table->integer('allocation_priority_score')
                  ->default(0)
                  ->after('is_fulfilled')
                  ->comment('分配優先級分數（越高優先級越高）');
                  
            $table->timestamp('priority_deadline')
                  ->nullable()
                  ->after('allocation_priority_score')
                  ->comment('優先級截止時間');
                  
            $table->json('allocation_metadata')
                  ->nullable()
                  ->after('priority_deadline')
                  ->comment('分配相關的元數據');
        });

        // 4. 創建分配歷史記錄表
        Schema::create('backorder_allocation_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('purchase_item_id')->nullable()->constrained('purchase_items')->onDelete('set null');
            $table->integer('allocated_quantity')->comment('分配數量');
            $table->integer('priority_score')->comment('當時的優先級分數');
            $table->enum('allocation_reason', [
                'fifo', 'customer_priority', 'order_priority', 'deadline', 'manual'
            ])->comment('分配原因');
            $table->json('allocation_context')->nullable()->comment('分配時的上下文信息');
            $table->foreignId('allocated_by')->constrained('users')->comment('分配操作者');
            $table->timestamps();
            
            $table->index(['order_item_id', 'created_at']);
            $table->index(['purchase_item_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backorder_allocation_history');
        
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn([
                'allocation_priority_score',
                'priority_deadline', 
                'allocation_metadata'
            ]);
        });
        
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'fulfillment_priority',
                'expected_delivery_date',
                'priority_reason'
            ]);
        });
        
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'priority_level',
                'is_priority_customer'
            ]);
        });
    }
};