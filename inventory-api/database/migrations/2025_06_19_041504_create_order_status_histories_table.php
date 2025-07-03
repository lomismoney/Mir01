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
        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            
            // 記錄變更的狀態類型，例如 'payment', 'shipping', 'line_item' 等
            $table->string('status_type');
            
            // 記錄狀態的變化
            $table->string('from_status')->nullable(); // 初始狀態時可為空
            $table->string('to_status');
            
            // 記錄操作者和備註
            $table->foreignId('user_id')->nullable()->constrained('users'); // 執行此操作的管理員，系統自動變更時可為空
            $table->text('notes')->nullable(); // 可用於記錄部分付款金額、出貨單號等上下文信息

            // 僅需記錄創建時間
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_status_histories');
    }
};
