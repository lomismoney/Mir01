<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 統一所有金額欄位使用分為單位儲存
     */
    public function up(): void
    {
        // 1. 備份和轉換 orders 表的金額欄位
        Schema::table('orders', function (Blueprint $table) {
            // 先添加新的分為單位欄位
            $table->bigInteger('subtotal_cents')->nullable()->after('subtotal');
            $table->bigInteger('shipping_fee_cents')->nullable()->after('shipping_fee');
            $table->bigInteger('tax_cents')->nullable()->after('tax');
            $table->bigInteger('discount_amount_cents')->nullable()->after('discount_amount');
            $table->bigInteger('grand_total_cents')->nullable()->after('grand_total');
            $table->bigInteger('paid_amount_cents')->nullable()->after('paid_amount');
        });

        // 轉換 orders 表的數據
        DB::statement('UPDATE orders SET 
            subtotal_cents = ROUND(subtotal * 100),
            shipping_fee_cents = ROUND(shipping_fee * 100),
            tax_cents = ROUND(tax * 100),
            discount_amount_cents = ROUND(discount_amount * 100),
            grand_total_cents = ROUND(grand_total * 100),
            paid_amount_cents = ROUND(paid_amount * 100)
        ');

        // 2. 備份和轉換 order_items 表的金額欄位
        Schema::table('order_items', function (Blueprint $table) {
            $table->bigInteger('price_cents')->nullable()->after('price');
            $table->bigInteger('cost_cents')->nullable()->after('cost');
            $table->bigInteger('discount_amount_cents')->nullable()->after('discount_amount');
        });

        // 轉換 order_items 表的數據
        DB::statement('UPDATE order_items SET 
            price_cents = ROUND(price * 100),
            cost_cents = ROUND(cost * 100),
            discount_amount_cents = ROUND(discount_amount * 100)
        ');

        // 3. 備份和轉換 product_variants 表的金額欄位
        Schema::table('product_variants', function (Blueprint $table) {
            $table->bigInteger('price_cents')->nullable()->after('price');
            $table->bigInteger('cost_price_cents')->nullable()->after('cost_price');
            $table->bigInteger('average_cost_cents')->nullable()->after('average_cost');
            $table->bigInteger('total_cost_amount_cents')->nullable()->after('total_cost_amount');
        });

        // 轉換 product_variants 表的數據
        DB::statement('UPDATE product_variants SET 
            price_cents = ROUND(price * 100),
            cost_price_cents = ROUND(cost_price * 100),
            average_cost_cents = ROUND(average_cost * 100),
            total_cost_amount_cents = ROUND(total_cost_amount * 100)
        ');

        // 4. 備份和轉換 payment_records 表的金額欄位
        Schema::table('payment_records', function (Blueprint $table) {
            $table->bigInteger('amount_cents')->nullable()->after('amount');
        });

        // 轉換 payment_records 表的數據
        DB::statement('UPDATE payment_records SET amount_cents = ROUND(amount * 100)');

        // 5. 備份和轉換 refunds 表的金額欄位
        Schema::table('refunds', function (Blueprint $table) {
            $table->bigInteger('total_refund_amount_cents')->nullable()->after('total_refund_amount');
        });

        // 轉換 refunds 表的數據
        DB::statement('UPDATE refunds SET total_refund_amount_cents = ROUND(total_refund_amount * 100)');

        // 6. 備份和轉換 refund_items 表的金額欄位
        Schema::table('refund_items', function (Blueprint $table) {
            $table->bigInteger('refund_subtotal_cents')->nullable()->after('refund_subtotal');
        });

        // 轉換 refund_items 表的數據
        DB::statement('UPDATE refund_items SET refund_subtotal_cents = ROUND(refund_subtotal * 100)');

        // 7. 備份和轉換 customers 表的金額欄位
        Schema::table('customers', function (Blueprint $table) {
            $table->bigInteger('total_unpaid_amount_cents')->nullable()->after('total_unpaid_amount');
            $table->bigInteger('total_completed_amount_cents')->nullable()->after('total_completed_amount');
        });

        // 轉換 customers 表的數據
        DB::statement('UPDATE customers SET 
            total_unpaid_amount_cents = ROUND(total_unpaid_amount * 100),
            total_completed_amount_cents = ROUND(total_completed_amount * 100)
        ');

        // 8. 建立新的統一金額值表（用於記錄轉換狀態）
        Schema::create('currency_migration_log', function (Blueprint $table) {
            $table->id();
            $table->string('table_name');
            $table->string('column_name');
            $table->enum('status', ['pending', 'converted', 'verified', 'completed']);
            $table->bigInteger('total_records');
            $table->bigInteger('converted_records');
            $table->json('conversion_errors')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // 記錄轉換狀態
        $conversions = [
            ['table_name' => 'orders', 'column_name' => 'subtotal_cents'],
            ['table_name' => 'orders', 'column_name' => 'shipping_fee_cents'],
            ['table_name' => 'orders', 'column_name' => 'tax_cents'],
            ['table_name' => 'orders', 'column_name' => 'discount_amount_cents'],
            ['table_name' => 'orders', 'column_name' => 'grand_total_cents'],
            ['table_name' => 'orders', 'column_name' => 'paid_amount_cents'],
            ['table_name' => 'order_items', 'column_name' => 'price_cents'],
            ['table_name' => 'order_items', 'column_name' => 'cost_cents'],
            ['table_name' => 'order_items', 'column_name' => 'discount_amount_cents'],
            ['table_name' => 'product_variants', 'column_name' => 'price_cents'],
            ['table_name' => 'product_variants', 'column_name' => 'cost_price_cents'],
            ['table_name' => 'product_variants', 'column_name' => 'average_cost_cents'],
            ['table_name' => 'product_variants', 'column_name' => 'total_cost_amount_cents'],
            ['table_name' => 'payment_records', 'column_name' => 'amount_cents'],
            ['table_name' => 'refunds', 'column_name' => 'total_refund_amount_cents'],
            ['table_name' => 'refund_items', 'column_name' => 'refund_subtotal_cents'],
            ['table_name' => 'customers', 'column_name' => 'total_unpaid_amount_cents'],
            ['table_name' => 'customers', 'column_name' => 'total_completed_amount_cents'],
        ];

        foreach ($conversions as $conversion) {
            DB::table('currency_migration_log')->insert([
                'table_name' => $conversion['table_name'],
                'column_name' => $conversion['column_name'],
                'status' => 'converted',
                'total_records' => DB::table($conversion['table_name'])->count(),
                'converted_records' => DB::table($conversion['table_name'])->count(),
                'started_at' => now(),
                'completed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currency_migration_log');
        
        // 移除新增的分為單位欄位
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['total_unpaid_amount_cents', 'total_completed_amount_cents']);
        });
        
        Schema::table('refund_items', function (Blueprint $table) {
            $table->dropColumn('refund_subtotal_cents');
        });
        
        Schema::table('refunds', function (Blueprint $table) {
            $table->dropColumn('total_refund_amount_cents');
        });
        
        Schema::table('payment_records', function (Blueprint $table) {
            $table->dropColumn('amount_cents');
        });
        
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['price_cents', 'cost_price_cents', 'average_cost_cents', 'total_cost_amount_cents']);
        });
        
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['price_cents', 'cost_cents', 'discount_amount_cents']);
        });
        
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['subtotal_cents', 'shipping_fee_cents', 'tax_cents', 'discount_amount_cents', 'grand_total_cents', 'paid_amount_cents']);
        });
    }
};