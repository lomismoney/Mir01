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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // 人類可讀的訂單號，設為唯一
            
            // 關聯鍵
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('creator_user_id')->constrained('users');

            // 雙重狀態機
            $table->string('shipping_status'); // 貨物進度: 待出貨, 已出貨, 已完成, 已取消
            $table->string('payment_status');  // 付款進度: 待付款, 已付款, 未付款, 部分付款

            // 價格組成
            $table->decimal('subtotal', 12, 2)->default(0);          // 商品總價
            $table->decimal('shipping_fee', 12, 2)->default(0);      // 運費
            $table->decimal('tax', 12, 2)->default(0);               // 稅金
            $table->decimal('discount_amount', 12, 2)->default(0);   // 折扣金額
            $table->decimal('grand_total', 12, 2)->default(0);       // 最終總金額

            // 其他訂單元數據
            $table->string('payment_method'); // 付款方式: 現金, 轉帳, 刷卡
            $table->string('order_source');   // 客戶來源: 現場客戶, 網站客戶, LINE客戶
            $table->text('shipping_address'); // 運送地址快照
            $table->text('notes')->nullable(); // 訂單備註

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
