<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 統一系統中的 decimal 資料型態
     * 
     * 將所有金額相關欄位統一為 decimal(12, 2) 以支援更大金額
     * 並確保資料型態的一致性
     */
    public function up(): void
    {
        // 修改 purchase_items 表的金額欄位
        Schema::table('purchase_items', function (Blueprint $table) {
            // 從 decimal(10, 2) 改為 decimal(12, 2)
            $table->decimal('unit_price', 12, 2)->change();
            $table->decimal('cost_price', 12, 2)->change();
            $table->decimal('allocated_shipping_cost', 12, 2)->change();
        });

        // 修改 purchases 表的金額欄位（確保一致性）
        Schema::table('purchases', function (Blueprint $table) {
            // 確保所有金額欄位都是 decimal(12, 2)
            $table->decimal('total_amount', 12, 2)->change();
            $table->decimal('shipping_cost', 12, 2)->change();
        });

        // 修改 refunds 表的金額欄位
        Schema::table('refunds', function (Blueprint $table) {
            $table->decimal('total_refund_amount', 12, 2)->change();
        });

        // 修改 refund_items 表的金額欄位
        Schema::table('refund_items', function (Blueprint $table) {
            $table->decimal('refund_subtotal', 12, 2)->change();
        });

        // 修改 payment_records 表的金額欄位
        Schema::table('payment_records', function (Blueprint $table) {
            $table->decimal('amount', 12, 2)->change();
        });

        // 修改 product_variants 表的成本欄位（如果存在）
        Schema::table('product_variants', function (Blueprint $table) {
            // 檢查 cost 欄位是否存在
            if (Schema::hasColumn('product_variants', 'cost')) {
                $table->decimal('cost', 12, 2)->nullable()->change();
            }
            
            // 檢查 cost_price 欄位是否存在
            if (Schema::hasColumn('product_variants', 'cost_price')) {
                $table->decimal('cost_price', 12, 2)->nullable()->change();
            }
        });

        // 修改 installations 表的金額欄位（如果存在）
        if (Schema::hasTable('installations')) {
            Schema::table('installations', function (Blueprint $table) {
                if (Schema::hasColumn('installations', 'installation_fee')) {
                    $table->decimal('installation_fee', 12, 2)->change();
                }
            });
        }

        // 修改 installation_items 表的金額欄位（如果存在）
        if (Schema::hasTable('installation_items')) {
            Schema::table('installation_items', function (Blueprint $table) {
                if (Schema::hasColumn('installation_items', 'price')) {
                    $table->decimal('price', 12, 2)->change();
                }
            });
        }
    }

    /**
     * 回滾變更
     * 
     * 注意：回滾可能會造成資料截斷，如果金額超過 decimal(10, 2) 的範圍
     */
    public function down(): void
    {
        // 回滾 purchase_items 表
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('unit_price', 10, 2)->change();
            $table->decimal('cost_price', 10, 2)->change();
            $table->decimal('allocated_shipping_cost', 10, 2)->change();
        });

        // 回滾 purchases 表
        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('total_amount', 10, 2)->change();
            $table->decimal('shipping_cost', 10, 2)->change();
        });

        // 回滾 refunds 表
        Schema::table('refunds', function (Blueprint $table) {
            $table->decimal('total_refund_amount', 10, 2)->change();
        });

        // 回滾 refund_items 表
        Schema::table('refund_items', function (Blueprint $table) {
            $table->decimal('refund_subtotal', 10, 2)->change();
        });

        // 回滾 payment_records 表
        Schema::table('payment_records', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->change();
        });

        // 回滾 product_variants 表
        Schema::table('product_variants', function (Blueprint $table) {
            // 檢查 cost 欄位是否存在
            if (Schema::hasColumn('product_variants', 'cost')) {
                $table->decimal('cost', 10, 2)->nullable()->change();
            }
            
            // 檢查 cost_price 欄位是否存在
            if (Schema::hasColumn('product_variants', 'cost_price')) {
                $table->decimal('cost_price', 10, 2)->nullable()->change();
            }
        });

        // 回滾 installations 表（如果存在）
        if (Schema::hasTable('installations')) {
            Schema::table('installations', function (Blueprint $table) {
                if (Schema::hasColumn('installations', 'installation_fee')) {
                    $table->decimal('installation_fee', 10, 2)->change();
                }
            });
        }

        // 回滾 installation_items 表（如果存在）
        if (Schema::hasTable('installation_items')) {
            Schema::table('installation_items', function (Blueprint $table) {
                if (Schema::hasColumn('installation_items', 'price')) {
                    $table->decimal('price', 10, 2)->change();
                }
            });
        }
    }
};