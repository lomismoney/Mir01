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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->onDelete('cascade'); // 哪個門市賣出的
            $table->string('transaction_number')->unique(); // 交易單號
            $table->decimal('total_amount', 10, 2); // 這筆交易的總金額
            $table->timestamp('sold_at'); // 銷售日期
            $table->string('payment_method')->default('cash'); // 例如: cash, credit_card
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
