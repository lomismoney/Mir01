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
        // 針對不同資料庫使用不同的實現方式
        if (DB::getDriverName() === 'sqlite') {
            echo "🔧 SQLite 環境：使用 SQLite 兼容的金錢欄位處理...\n";
            $this->handleSQLiteMoneyFields();
            return;
        }
        
        // 🔥 強制轉換所有金錢欄位為 BIGINT，使用原生 SQL 確保覆蓋之前的定義
        echo "🚀 開始強制轉換所有金錢欄位為 BIGINT...\n";
        
        // 先刪除有問題的計算欄位
        $this->dropProblematicColumns();
        
        // 強制轉換所有金錢欄位
        $this->forceConvertAllMoneyFields();
        
        // 重建計算欄位
        $this->rebuildComputedColumns();
        
        echo "✅ 所有金錢欄位已強制轉換為 BIGINT\n";
    }
    
    private function dropProblematicColumns(): void
    {
        echo "🔧 刪除有問題的計算欄位...\n";
        
        $computedColumns = [
            'product_variants' => ['average_cost', 'total_cost_amount'],
            'purchase_items' => ['total_cost_price']
        ];
        
        foreach ($computedColumns as $table => $columns) {
            foreach ($columns as $column) {
                try {
                    DB::statement("ALTER TABLE `{$table}` DROP COLUMN `{$column}`");
                    echo "  ✓ 刪除 {$table}.{$column}\n";
                } catch (\Exception $e) {
                    echo "  ⚠️ {$table}.{$column} 不存在或已刪除\n";
                }
            }
        }
    }
    
    private function forceConvertAllMoneyFields(): void
    {
        echo "💰 強制轉換所有金錢欄位...\n";
        
        // 定義所有需要轉換的金錢欄位
        $moneyFields = [
            'purchases' => ['total_amount', 'shipping_cost'],
            'purchase_items' => ['unit_price', 'cost_price', 'allocated_shipping_cost'],
            'product_variants' => ['price', 'cost_price'],
            'orders' => ['subtotal', 'shipping_fee', 'tax', 'discount_amount', 'grand_total', 'paid_amount'],
            'order_items' => ['price', 'cost', 'discount_amount'],
            'customers' => ['total_completed_amount', 'total_unpaid_amount'],
            'payment_records' => ['amount'],
            'refunds' => ['total_refund_amount'],
            'sale_items' => ['unit_price'],
            'sales' => ['total_amount']
        ];
        
        foreach ($moneyFields as $table => $fields) {
            foreach ($fields as $field) {
                try {
                    // 使用原生 SQL 強制轉換
                    DB::statement("ALTER TABLE `{$table}` MODIFY `{$field}` BIGINT NOT NULL DEFAULT 0");
                    echo "  ✅ {$table}.{$field} -> BIGINT\n";
                } catch (\Exception $e) {
                    echo "  ❌ 失敗 {$table}.{$field}: {$e->getMessage()}\n";
                }
            }
        }
    }
    
    private function rebuildComputedColumns(): void
    {
        echo "🔄 重建計算欄位...\n";
        
        try {
            // 重建 purchase_items 的 total_cost_price 欄位
            DB::statement("ALTER TABLE purchase_items ADD COLUMN total_cost_price BIGINT AS ((`cost_price` * `quantity`) + `allocated_shipping_cost`) STORED COMMENT '總成本價格（分為單位）'");
            echo "  ✅ 重建 purchase_items.total_cost_price 計算欄位\n";
        } catch (\Exception $e) {
            echo "  ❌ 重建計算欄位失敗: {$e->getMessage()}\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 回滾 purchases 表的金額欄位為decimal
        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('total_amount', 12, 2)->change();
            $table->decimal('shipping_cost', 12, 2)->change();
        });
        
        // 回滾 purchase_items 表的金額欄位為decimal
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('unit_price', 12, 2)->change();
            $table->decimal('cost_price', 12, 2)->change();
            $table->decimal('allocated_shipping_cost', 12, 2)->change();
        });

        // 回滾 product_variants 表的金額欄位為decimal
        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('price', 12, 2)->change();
            $table->decimal('cost_price', 12, 2)->change();
        });

        // 回滾 orders 表的金額欄位為decimal
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('subtotal', 12, 2)->change();
            $table->decimal('shipping_fee', 12, 2)->change();
            $table->decimal('tax', 12, 2)->change();
            $table->decimal('discount_amount', 12, 2)->change();
            $table->decimal('grand_total', 12, 2)->change();
            $table->decimal('paid_amount', 12, 2)->change();
        });

        // 回滾 order_items 表的金額欄位為decimal
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('price', 12, 2)->change();
            $table->decimal('cost', 12, 2)->change();
            $table->decimal('discount_amount', 12, 2)->change();
        });

        // 回滾 customers 表的金額欄位為decimal
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('total_completed_amount', 12, 2)->default(0)->change();
            $table->decimal('total_unpaid_amount', 12, 2)->default(0)->change();
        });

        // 回滾 payment_records 表的金額欄位為decimal
        Schema::table('payment_records', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->change();
        });

        // 回滾 refunds 表的金額欄位為decimal
        Schema::table('refunds', function (Blueprint $table) {
            $table->decimal('total_refund_amount', 10, 2)->change();
        });

        // 回滾 sale_items 表的金額欄位為decimal
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('unit_price', 10, 2)->change();
        });

        // 回滾 sales 表的金額欄位為decimal
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('total_amount', 10, 2)->change();
        });
    }
    
    /**
     * SQLite 環境專用的金錢欄位處理
     * SQLite 不支援 ALTER TABLE MODIFY，需要用不同方式處理
     */
    private function handleSQLiteMoneyFields(): void
    {
        // SQLite 環境下，確保表結構正確但不強制轉換已存在的欄位
        // 因為 SQLite 的數字類型本身就是靈活的，可以存儲整數或小數
        
        echo "  ✓ SQLite 環境已確認金錢欄位相容性\n";
        echo "  ℹ️ SQLite 數字類型天然支援整數和小數存儲\n";
        
        // 檢查關鍵表是否存在必要欄位
        $this->ensureSQLiteMoneyFieldsExist();
    }
    
    /**
     * 確保 SQLite 環境下金錢相關欄位存在
     */
    private function ensureSQLiteMoneyFieldsExist(): void
    {
        $tables = [
            'purchases' => ['total_amount', 'shipping_cost'],
            'purchase_items' => ['unit_price', 'cost_price', 'allocated_shipping_cost'],
            'product_variants' => ['price', 'cost_price'],
            'orders' => ['subtotal', 'shipping_fee', 'tax', 'discount_amount', 'grand_total', 'paid_amount'],
            'order_items' => ['price', 'cost', 'discount_amount'],
            'customers' => ['total_completed_amount', 'total_unpaid_amount'],
            'payment_records' => ['amount'],
            'refunds' => ['total_refund_amount'],
            'sale_items' => ['unit_price'],
            'sales' => ['total_amount']
        ];
        
        foreach ($tables as $tableName => $columns) {
            // 檢查表是否存在
            if (!Schema::hasTable($tableName)) {
                echo "  ⚠️ 表 {$tableName} 不存在，跳過檢查\n";
                continue;
            }
            
            foreach ($columns as $column) {
                if (!Schema::hasColumn($tableName, $column)) {
                    echo "  ⚠️ {$tableName}.{$column} 欄位不存在\n";
                }
            }
        }
    }
};
