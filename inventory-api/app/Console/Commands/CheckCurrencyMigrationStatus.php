<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CheckCurrencyMigrationStatus extends Command
{
    protected $signature = 'currency:check-status';
    protected $description = '檢查金額統一化的完成狀態';

    // 需要檢查的模型和欄位
    const MODELS_TO_CHECK = [
        'orders' => [
            'fields' => ['subtotal', 'shipping_fee', 'tax', 'discount_amount', 'grand_total', 'paid_amount'],
            'model_class' => 'App\Models\Order',
            'trait_added' => true,
            'accessors_added' => true,
        ],
        'order_items' => [
            'fields' => ['price', 'cost', 'discount_amount'],
            'model_class' => 'App\Models\OrderItem', 
            'trait_added' => true,
            'accessors_added' => true,
        ],
        'product_variants' => [
            'fields' => ['price', 'cost_price', 'average_cost', 'total_cost_amount'],
            'model_class' => 'App\Models\ProductVariant',
            'trait_added' => true,
            'accessors_added' => false,
        ],
        'customers' => [
            'fields' => ['total_unpaid_amount', 'total_completed_amount'],
            'model_class' => 'App\Models\Customer',
            'trait_added' => false,
            'accessors_added' => false,
        ],
        'payment_records' => [
            'fields' => ['amount'],
            'model_class' => 'App\Models\PaymentRecord',
            'trait_added' => false,
            'accessors_added' => false,
        ],
        'refunds' => [
            'fields' => ['total_refund_amount'],
            'model_class' => 'App\Models\Refund',
            'trait_added' => false,
            'accessors_added' => false,
        ],
        'refund_items' => [
            'fields' => ['refund_subtotal'],
            'model_class' => 'App\Models\RefundItem',
            'trait_added' => false,
            'accessors_added' => false,
        ],
    ];

    public function handle()
    {
        $this->info('🔍 檢查金額統一化狀態...');
        $this->newLine();

        $overallStatus = $this->checkOverallStatus();
        $this->displayOverallStatus($overallStatus);
        
        $this->newLine();
        $this->info('📊 詳細狀態檢查：');
        
        foreach (self::MODELS_TO_CHECK as $table => $config) {
            $this->checkTableStatus($table, $config);
        }
        
        $this->newLine();
        $this->displayRecommendations($overallStatus);
    }

    protected function checkOverallStatus(): array
    {
        $status = [
            'migration_file_exists' => file_exists(database_path('migrations/2025_07_11_090000_unify_currency_to_cents.php')),
            'currency_trait_exists' => file_exists(app_path('Traits/HandlesCurrency.php')),
            'migration_service_exists' => file_exists(app_path('Services/CurrencyMigrationService.php')),
            'artisan_command_exists' => file_exists(app_path('Console/Commands/MigrateCurrencyToCents.php')),
            'completed_models' => 0,
            'total_models' => count(self::MODELS_TO_CHECK),
        ];

        // 計算完成的模型數量
        foreach (self::MODELS_TO_CHECK as $table => $config) {
            if ($config['trait_added'] && $config['accessors_added']) {
                $status['completed_models']++;
            }
        }

        $status['completion_percentage'] = ($status['completed_models'] / $status['total_models']) * 100;

        return $status;
    }

    protected function displayOverallStatus(array $status): void
    {
        $this->table(['項目', '狀態'], [
            ['數據庫遷移檔案', $status['migration_file_exists'] ? '✅ 已建立' : '❌ 未建立'],
            ['HandlesCurrency Trait', $status['currency_trait_exists'] ? '✅ 已建立' : '❌ 未建立'],
            ['CurrencyMigrationService', $status['migration_service_exists'] ? '✅ 已建立' : '❌ 未建立'],
            ['Artisan 命令', $status['artisan_command_exists'] ? '✅ 已建立' : '❌ 未建立'],
            ['模型完成度', "{$status['completed_models']}/{$status['total_models']} (" . round($status['completion_percentage'], 1) . "%)"],
        ]);
    }

    protected function checkTableStatus(string $table, array $config): void
    {
        $this->line("  📦 {$table} ({$config['model_class']}):");
        
        // 檢查 Trait 是否已加入
        $traitStatus = $config['trait_added'] ? '✅' : '❌';
        $this->line("    {$traitStatus} HandlesCurrency Trait");
        
        // 檢查 Accessor/Mutator 是否已添加
        $accessorStatus = $config['accessors_added'] ? '✅' : '❌';
        $this->line("    {$accessorStatus} Accessor/Mutator 方法");
        
        // 檢查數據庫欄位
        foreach ($config['fields'] as $field) {
            $centsField = $field . '_cents';
            $exists = Schema::hasColumn($table, $centsField);
            $status = $exists ? '✅' : '❌';
            $this->line("    {$status} {$centsField} 欄位");
        }
        
        $this->newLine();
    }

    protected function displayRecommendations(array $status): void
    {
        $this->info('💡 建議執行步驟：');
        
        if (!$status['migration_file_exists']) {
            $this->line('  1. 執行數據庫遷移：php artisan migrate');
        }
        
        if ($status['completion_percentage'] < 100) {
            $this->line('  2. 完成剩餘模型的 HandlesCurrency Trait 整合');
            $this->line('  3. 為所有模型添加 Accessor/Mutator 方法');
        }
        
        if ($status['completion_percentage'] >= 80) {
            $this->line('  4. 執行金額轉換：php artisan currency:migrate-to-cents');
            $this->line('  5. 驗證轉換結果：php artisan currency:migrate-to-cents --status');
        }
        
        $this->line('  6. 更新相關測試以確保功能正常');
    }
}