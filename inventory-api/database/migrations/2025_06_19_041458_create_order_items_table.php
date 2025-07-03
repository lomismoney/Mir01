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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');

            // 關聯到商品變體。對於訂製商品，此項可為空。
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants');
            
            // 關鍵業務邏輯字段
            $table->boolean('is_stocked_sale')->default(true); // 是否為庫存銷售，用於決定是否扣減庫存
            $table->string('status'); // 單項商品的進度: 待處理, 已叫貨, 已出貨, 完成
            $table->json('custom_specifications')->nullable(); // 用於儲存訂製商品的規格，例如 {"寬度": "150cm"}

            // 交易快照字段，確保交易記錄的不可變性
            $table->string('product_name'); // 商品名稱快照
            $table->string('sku');          // SKU 快照
            $table->decimal('price', 12, 2); // 當時的售價快照
            $table->unsignedInteger('quantity'); // 數量

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
