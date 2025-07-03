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
        Schema::table('orders', function (Blueprint $table) {
            // 付款相關欄位
            $table->timestamp('paid_at')->nullable()->after('payment_status');
            
            // 出貨相關欄位
            $table->string('tracking_number')->nullable()->after('shipping_status');
            $table->string('carrier')->nullable()->after('tracking_number');
            $table->timestamp('shipped_at')->nullable()->after('carrier');
            $table->date('estimated_delivery_date')->nullable()->after('shipped_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'paid_at',
                'tracking_number', 
                'carrier',
                'shipped_at',
                'estimated_delivery_date'
            ]);
        });
    }
};
