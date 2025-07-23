<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. 轉換 orders 表的金額欄位
        Schema::table('orders', function (Blueprint $table) {
            // 新增含稅狀態和稅率欄位
            $table->boolean('is_tax_inclusive')->default(false)->after('payment_status')->comment('是否含稅');
            $table->decimal('tax_rate', 5, 2)->default(5.00)->after('is_tax_inclusive')->comment('稅率百分比');
            
            // 新增臨時欄位來儲存轉換後的值
            $table->bigInteger('subtotal_cents')->default(0)->after('subtotal');
            $table->bigInteger('shipping_fee_cents')->default(0)->after('shipping_fee');
            $table->bigInteger('tax_cents')->default(0)->after('tax');
            $table->bigInteger('discount_amount_cents')->default(0)->after('discount_amount');
            $table->bigInteger('grand_total_cents')->default(0)->after('grand_total');
            $table->bigInteger('paid_amount_cents')->default(0)->after('paid_amount');
        });
        
        // 資料轉換：將現有的 decimal 值轉換為分
        DB::statement('UPDATE orders SET 
            subtotal_cents = ROUND(subtotal * 100),
            shipping_fee_cents = ROUND(shipping_fee * 100),
            tax_cents = ROUND(tax * 100),
            discount_amount_cents = ROUND(discount_amount * 100),
            grand_total_cents = ROUND(grand_total * 100),
            paid_amount_cents = ROUND(paid_amount * 100)
        ');
        
        // 刪除舊欄位
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'shipping_fee', 'tax', 'discount_amount', 'grand_total', 'paid_amount']);
        });
        
        // 重命名新欄位
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('subtotal_cents', 'subtotal');
            $table->renameColumn('shipping_fee_cents', 'shipping_fee');
            $table->renameColumn('tax_cents', 'tax');
            $table->renameColumn('discount_amount_cents', 'discount_amount');
            $table->renameColumn('grand_total_cents', 'grand_total');
            $table->renameColumn('paid_amount_cents', 'paid_amount');
        });
        
        // 2. 轉換 order_items 表的金額欄位
        Schema::table('order_items', function (Blueprint $table) {
            // 新增臨時欄位
            $table->bigInteger('price_cents')->default(0)->after('price');
            $table->bigInteger('cost_cents')->default(0)->after('cost');
        });
        
        // 資料轉換
        DB::statement('UPDATE order_items SET 
            price_cents = ROUND(price * 100),
            cost_cents = ROUND(cost * 100)
        ');
        
        // 刪除舊欄位（包括 tax_rate 和 discount_amount）
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['price', 'cost', 'tax_rate', 'discount_amount']);
        });
        
        // 重命名新欄位
        Schema::table('order_items', function (Blueprint $table) {
            $table->renameColumn('price_cents', 'price');
            $table->renameColumn('cost_cents', 'cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. 還原 orders 表
        Schema::table('orders', function (Blueprint $table) {
            // 新增臨時 decimal 欄位
            $table->decimal('subtotal_decimal', 12, 2)->default(0)->after('subtotal');
            $table->decimal('shipping_fee_decimal', 12, 2)->default(0)->after('shipping_fee');
            $table->decimal('tax_decimal', 12, 2)->default(0)->after('tax');
            $table->decimal('discount_amount_decimal', 12, 2)->default(0)->after('discount_amount');
            $table->decimal('grand_total_decimal', 12, 2)->default(0)->after('grand_total');
            $table->decimal('paid_amount_decimal', 12, 2)->default(0)->after('paid_amount');
        });
        
        // 資料轉換：將分轉換回元
        DB::statement('UPDATE orders SET 
            subtotal_decimal = subtotal / 100,
            shipping_fee_decimal = shipping_fee / 100,
            tax_decimal = tax / 100,
            discount_amount_decimal = discount_amount / 100,
            grand_total_decimal = grand_total / 100,
            paid_amount_decimal = paid_amount / 100
        ');
        
        // 刪除 bigInteger 欄位
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'shipping_fee', 'tax', 'discount_amount', 'grand_total', 'paid_amount']);
            $table->dropColumn(['is_tax_inclusive', 'tax_rate']);
        });
        
        // 重命名欄位
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('subtotal_decimal', 'subtotal');
            $table->renameColumn('shipping_fee_decimal', 'shipping_fee');
            $table->renameColumn('tax_decimal', 'tax');
            $table->renameColumn('discount_amount_decimal', 'discount_amount');
            $table->renameColumn('grand_total_decimal', 'grand_total');
            $table->renameColumn('paid_amount_decimal', 'paid_amount');
        });
        
        // 2. 還原 order_items 表
        Schema::table('order_items', function (Blueprint $table) {
            // 新增臨時 decimal 欄位
            $table->decimal('price_decimal', 12, 2)->default(0)->after('price');
            $table->decimal('cost_decimal', 12, 2)->default(0)->after('cost');
            $table->decimal('tax_rate', 5, 2)->default(0)->comment('稅率百分比');
            $table->decimal('discount_amount', 12, 2)->default(0)->comment('折扣金額');
        });
        
        // 資料轉換
        DB::statement('UPDATE order_items SET 
            price_decimal = price / 100,
            cost_decimal = cost / 100
        ');
        
        // 刪除 bigInteger 欄位
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['price', 'cost']);
        });
        
        // 重命名欄位
        Schema::table('order_items', function (Blueprint $table) {
            $table->renameColumn('price_decimal', 'price');
            $table->renameColumn('cost_decimal', 'cost');
        });
    }
};