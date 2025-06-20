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
        Schema::create('payment_records', function (Blueprint $table) {
            $table->id();
            
            // 關聯鍵
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('creator_id')->constrained('users');
            
            // 付款資訊
            $table->decimal('amount', 10, 2); // 收款金額
            $table->string('payment_method'); // 收款方式: cash, transfer, credit_card
            $table->datetime('payment_date'); // 收款日期
            $table->text('notes')->nullable(); // 備註
            
            $table->timestamps();
            
            // 索引優化
            $table->index(['order_id', 'payment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_records');
    }
};
