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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->onDelete('cascade'); // 貨進到哪個門市
            $table->string('order_number')->unique(); // 進貨單號
            $table->decimal('total_amount', 10, 2); // 這張單的總金額
            $table->timestamp('purchased_at'); // 進貨日期
            $table->string('status')->default('completed'); // 例如: pending, completed, cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
