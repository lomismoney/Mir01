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
        Schema::table('order_items', function (Blueprint $table) {
            // 添加成本欄位
            if (!Schema::hasColumn('order_items', 'cost')) {
                $table->decimal('cost', 12, 2)->nullable()->after('price')
                    ->comment('商品成本快照');
            }
            
            // 添加稅率欄位
            if (!Schema::hasColumn('order_items', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->default(0)->after('quantity')
                    ->comment('稅率百分比');
            }
            
            // 添加折扣金額欄位
            if (!Schema::hasColumn('order_items', 'discount_amount')) {
                $table->decimal('discount_amount', 12, 2)->default(0)->after('tax_rate')
                    ->comment('折扣金額');
            }
            
            // 添加訂製商品相關欄位
            if (!Schema::hasColumn('order_items', 'custom_product_image')) {
                $table->string('custom_product_image')->nullable()->after('custom_specifications')
                    ->comment('訂製商品圖片');
            }
            if (!Schema::hasColumn('order_items', 'custom_product_category')) {
                $table->string('custom_product_category')->nullable()->after('custom_product_image')
                    ->comment('訂製商品分類');
            }
            if (!Schema::hasColumn('order_items', 'custom_product_brand')) {
                $table->string('custom_product_brand')->nullable()->after('custom_product_category')
                    ->comment('訂製商品品牌');
            }
            if (!Schema::hasColumn('order_items', 'custom_product_specs')) {
                $table->json('custom_product_specs')->nullable()->after('custom_product_brand')
                    ->comment('訂製商品規格（備用）');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn([
                'cost',
                'tax_rate',
                'discount_amount',
                'custom_product_image',
                'custom_product_category',
                'custom_product_brand',
                'custom_product_specs'
            ]);
        });
    }
};
