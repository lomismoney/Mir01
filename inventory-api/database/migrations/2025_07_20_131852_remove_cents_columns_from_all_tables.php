<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 移除所有 cents 相關欄位
     * 回歸使用原本的 decimal 欄位儲存金額
     */
    public function up(): void
    {
        // 1. 移除 orders 表的 cents 欄位
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal_cents',
                'shipping_fee_cents',
                'tax_cents',
                'discount_amount_cents',
                'grand_total_cents',
                'paid_amount_cents'
            ]);
        });

        // 2. 移除 order_items 表的 cents 欄位
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn([
                'price_cents',
                'cost_cents',
                'discount_amount_cents'
            ]);
        });

        // 3. 移除 product_variants 表的 cents 欄位
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn([
                'price_cents',
                'cost_price_cents',
                'average_cost_cents',
                'total_cost_amount_cents'
            ]);
        });

        // 4. 移除 payment_records 表的 cents 欄位
        Schema::table('payment_records', function (Blueprint $table) {
            $table->dropColumn('amount_cents');
        });

        // 5. 移除 refunds 表的 cents 欄位
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropColumn('total_refund_amount_cents');
        });

        // 6. 移除 refund_items 表的 cents 欄位
        Schema::table('refund_items', function (Blueprint $table) {
            $table->dropColumn('refund_subtotal_cents');
        });

        // 7. 移除 customers 表的 cents 欄位
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'total_unpaid_amount_cents',
                'total_completed_amount_cents'
            ]);
        });
    }

    /**
     * 回滾操作 - 重新加入 cents 欄位
     */
    public function down(): void
    {
        // 1. 恢復 orders 表的 cents 欄位
        Schema::table('orders', function (Blueprint $table) {
            $table->bigInteger('subtotal_cents')->nullable()->after('subtotal');
            $table->bigInteger('shipping_fee_cents')->nullable()->after('shipping_fee');
            $table->bigInteger('tax_cents')->nullable()->after('tax');
            $table->bigInteger('discount_amount_cents')->nullable()->after('discount_amount');
            $table->bigInteger('grand_total_cents')->nullable()->after('grand_total');
            $table->bigInteger('paid_amount_cents')->nullable()->after('paid_amount');
        });

        // 2. 恢復 order_items 表的 cents 欄位
        Schema::table('order_items', function (Blueprint $table) {
            $table->bigInteger('price_cents')->nullable()->after('price');
            $table->bigInteger('cost_cents')->nullable()->after('cost');
            $table->bigInteger('discount_amount_cents')->nullable()->after('discount_amount');
        });

        // 3. 恢復 product_variants 表的 cents 欄位
        Schema::table('product_variants', function (Blueprint $table) {
            $table->bigInteger('price_cents')->nullable()->after('price');
            $table->bigInteger('cost_price_cents')->nullable()->after('cost_price');
            $table->bigInteger('average_cost_cents')->nullable()->after('average_cost');
            $table->bigInteger('total_cost_amount_cents')->nullable()->after('total_cost_amount');
        });

        // 4. 恢復 payment_records 表的 cents 欄位
        Schema::table('payment_records', function (Blueprint $table) {
            $table->bigInteger('amount_cents')->nullable()->after('amount');
        });

        // 5. 恢復 refunds 表的 cents 欄位
        Schema::table('refunds', function (Blueprint $table) {
            $table->bigInteger('total_refund_amount_cents')->nullable()->after('total_refund_amount');
        });

        // 6. 恢復 refund_items 表的 cents 欄位
        Schema::table('refund_items', function (Blueprint $table) {
            $table->bigInteger('refund_subtotal_cents')->nullable()->after('refund_subtotal');
        });

        // 7. 恢復 customers 表的 cents 欄位
        Schema::table('customers', function (Blueprint $table) {
            $table->bigInteger('total_unpaid_amount_cents')->nullable()->after('total_unpaid_amount');
            $table->bigInteger('total_completed_amount_cents')->nullable()->after('total_completed_amount');
        });
    }
};