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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // 客戶姓名 或 公司抬頭
            $table->string('phone')->nullable()->index(); // 聯絡電話，允許為空，建立索引以優化搜索
            $table->boolean('is_company')->default(false); // 是否為公司客戶
            $table->string('tax_id')->nullable(); // 統一編號，公司戶填寫
            $table->string('industry_type'); // 客戶行業別
            $table->string('payment_type'); // 付款類別
            $table->string('contact_address')->nullable(); // 主要聯絡地址
            $table->decimal('total_unpaid_amount', 12, 2)->default(0); // 未付款總額
            $table->decimal('total_completed_amount', 12, 2)->default(0); // 已完成訂單總額
            $table->timestamps(); // created_at 和 updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
