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
        Schema::create('installations', function (Blueprint $table) {
            $table->id();
            $table->string('installation_number')->unique(); // 安裝單號，獨立編號系統
            
            // 關聯鍵（可選，實現鬆耦合）
            $table->foreignId('order_id')->nullable()->constrained('orders');
            $table->foreignId('installer_user_id')->nullable()->constrained('users');
            $table->foreignId('created_by')->constrained('users');
            
            // 客戶資訊（冗餘設計，支援非訂單安裝）
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('installation_address');
            
            // 狀態和時間管理
            $table->enum('status', [
                'pending',      // 待處理
                'scheduled',    // 已排程
                'in_progress',  // 進行中
                'completed',    // 已完成
                'cancelled'     // 已取消
            ])->default('pending');
            
            $table->date('scheduled_date')->nullable(); // 預計安裝日期
            $table->datetime('actual_start_time')->nullable(); // 實際開始時間
            $table->datetime('actual_end_time')->nullable(); // 實際結束時間
            
            // 備註
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // 索引
            $table->index('status');
            $table->index('scheduled_date');
            $table->index('installer_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installations');
    }
}; 