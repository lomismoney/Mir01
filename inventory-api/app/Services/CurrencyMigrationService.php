<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\PaymentRecord;
use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\Customer;
use App\Traits\HandlesCurrency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * 金額統一化服務
 * 
 * 負責處理系統中所有金額欄位從元（decimal）轉換為分（integer）的升級過程
 */
class CurrencyMigrationService
{
    use HandlesCurrency;

    /**
     * 需要進行金額轉換的模型配置
     */
    const MODEL_CONFIGS = [
        Order::class => [
            'table' => 'orders',
            'fields' => [
                'subtotal' => 'subtotal_cents',
                'shipping_fee' => 'shipping_fee_cents',
                'tax' => 'tax_cents',
                'discount_amount' => 'discount_amount_cents',
                'grand_total' => 'grand_total_cents',
                'paid_amount' => 'paid_amount_cents',
            ]
        ],
        OrderItem::class => [
            'table' => 'order_items',
            'fields' => [
                'price' => 'price_cents',
                'cost' => 'cost_cents',
                'discount_amount' => 'discount_amount_cents',
            ]
        ],
        ProductVariant::class => [
            'table' => 'product_variants',
            'fields' => [
                'price' => 'price_cents',
                'cost_price' => 'cost_price_cents',
                'average_cost' => 'average_cost_cents',
                'total_cost_amount' => 'total_cost_amount_cents',
            ]
        ],
        PaymentRecord::class => [
            'table' => 'payment_records',
            'fields' => [
                'amount' => 'amount_cents',
            ]
        ],
        Refund::class => [
            'table' => 'refunds',
            'fields' => [
                'total_refund_amount' => 'total_refund_amount_cents',
            ]
        ],
        RefundItem::class => [
            'table' => 'refund_items',
            'fields' => [
                'refund_subtotal' => 'refund_subtotal_cents',
            ]
        ],
        Customer::class => [
            'table' => 'customers',
            'fields' => [
                'total_unpaid_amount' => 'total_unpaid_amount_cents',
                'total_completed_amount' => 'total_completed_amount_cents',
            ]
        ],
    ];

    /**
     * 執行完整的金額統一化升級
     * 
     * @return array 升級結果報告
     */
    public function performFullMigration(): array
    {
        $report = [
            'started_at' => now(),
            'models_processed' => [],
            'total_records_converted' => 0,
            'errors' => [],
            'warnings' => [],
        ];

        Log::info('開始金額統一化升級');

        foreach (self::MODEL_CONFIGS as $modelClass => $config) {
            try {
                $modelReport = $this->migrateModel($modelClass, $config);
                $report['models_processed'][$modelClass] = $modelReport;
                $report['total_records_converted'] += $modelReport['records_converted'];
                
                Log::info("模型 {$modelClass} 金額轉換完成", $modelReport);
                
            } catch (\Exception $e) {
                $error = [
                    'model' => $modelClass,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ];
                
                $report['errors'][] = $error;
                Log::error("模型 {$modelClass} 金額轉換失敗", $error);
            }
        }

        $report['completed_at'] = now();
        $report['duration_seconds'] = $report['completed_at']->diffInSeconds($report['started_at']);
        $report['success'] = empty($report['errors']);

        Log::info('金額統一化升級完成', [
            'total_models' => count(self::MODEL_CONFIGS),
            'successful_models' => count($report['models_processed']),
            'failed_models' => count($report['errors']),
            'total_records' => $report['total_records_converted'],
            'duration' => $report['duration_seconds'] . '秒',
        ]);

        return $report;
    }

    /**
     * 根據表名轉換單個模型（用於測試）
     * 
     * @param string $tableName 表名
     * @return array 轉換結果
     */
    public function convertSingleModel(string $tableName): array
    {
        // 查找對應的模型配置
        $config = null;
        $modelClass = null;
        
        foreach (self::MODEL_CONFIGS as $class => $cfg) {
            if ($cfg['table'] === $tableName) {
                $config = $cfg;
                $modelClass = $class;
                break;
            }
        }
        
        if (!$config) {
            return ['success' => false, 'error' => "未找到表 {$tableName} 的配置"];
        }
        
        try {
            $result = $this->migrateModel($modelClass, $config);
            return [
                'success' => true,
                'converted_records' => $result['records_converted'],
                'model' => $modelClass,
                'table' => $tableName
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * 轉換單個模型的金額欄位
     * 
     * @param string $modelClass 模型類別名稱
     * @param array $config 配置陣列
     * @return array 轉換報告
     */
    protected function migrateModel(string $modelClass, array $config): array
    {
        $tableName = $config['table'];
        $fields = $config['fields'];
        
        $report = [
            'model' => $modelClass,
            'table' => $tableName,
            'fields_processed' => [],
            'records_converted' => 0,
            'validation_passed' => false,
        ];

        // 檢查表是否存在
        if (!Schema::hasTable($tableName)) {
            throw new \Exception("表 {$tableName} 不存在");
        }

        // 檢查分為單位的欄位是否存在
        foreach ($fields as $yuanField => $centsField) {
            if (!Schema::hasColumn($tableName, $centsField)) {
                throw new \Exception("表 {$tableName} 缺少分為單位欄位 {$centsField}");
            }
        }

        // 執行轉換
        DB::transaction(function () use ($tableName, $fields, &$report) {
            foreach ($fields as $yuanField => $centsField) {
                $fieldReport = $this->migrateField($tableName, $yuanField, $centsField);
                $report['fields_processed'][$yuanField] = $fieldReport;
                $report['records_converted'] += $fieldReport['records_updated'];
            }
        });

        // 驗證轉換結果
        $report['validation_passed'] = $this->validateConversion($tableName, $fields);

        return $report;
    }

    /**
     * 轉換單個欄位
     * 
     * @param string $tableName 表名
     * @param string $yuanField 元欄位名
     * @param string $centsField 分欄位名
     * @return array 欄位轉換報告
     */
    protected function migrateField(string $tableName, string $yuanField, string $centsField): array
    {
        // 更新分為單位欄位
        $updatedRows = DB::update(
            "UPDATE {$tableName} SET {$centsField} = ROUND({$yuanField} * 100) WHERE {$centsField} IS NULL OR {$centsField} = 0"
        );

        // 同步更新元欄位以保持精度一致性
        DB::update(
            "UPDATE {$tableName} SET {$yuanField} = ROUND({$centsField} / 100, 2) WHERE {$centsField} IS NOT NULL"
        );

        return [
            'yuan_field' => $yuanField,
            'cents_field' => $centsField,
            'records_updated' => $updatedRows,
        ];
    }

    /**
     * 驗證轉換結果
     * 
     * @param string $tableName 表名
     * @param array $fields 欄位映射
     * @return bool 驗證是否通過
     */
    protected function validateConversion(string $tableName, array $fields): bool
    {
        foreach ($fields as $yuanField => $centsField) {
            // 檢查是否有轉換錯誤（差異超過1分）
            $errors = DB::select(
                "SELECT COUNT(*) as error_count 
                 FROM {$tableName} 
                 WHERE ABS(ROUND({$yuanField} * 100) - {$centsField}) > 1"
            );

            if ($errors[0]->error_count > 0) {
                Log::warning("表 {$tableName} 欄位 {$yuanField} 轉換驗證失敗", [
                    'error_records' => $errors[0]->error_count
                ]);
                return false;
            }
        }

        return true;
    }

    /**
     * 取得金額轉換狀態報告
     * 
     * @return array 狀態報告
     */
    public function getConversionStatus(): array
    {
        $status = [
            'migration_log_exists' => Schema::hasTable('currency_migration_log'),
            'models_status' => [],
            'overall_progress' => 0,
        ];

        $totalModels = count(self::MODEL_CONFIGS);
        $completedModels = 0;

        foreach (self::MODEL_CONFIGS as $modelClass => $config) {
            $tableName = $config['table'];
            $fields = $config['fields'];
            
            $modelStatus = [
                'model' => $modelClass,
                'table' => $tableName,
                'fields_status' => [],
                'migration_complete' => true,
            ];

            foreach ($fields as $yuanField => $centsField) {
                $fieldStatus = [
                    'yuan_field' => $yuanField,
                    'cents_field' => $centsField,
                    'cents_field_exists' => Schema::hasColumn($tableName, $centsField),
                    'conversion_complete' => false,
                ];

                if ($fieldStatus['cents_field_exists']) {
                    // 檢查是否有記錄轉換完成
                    $convertedCount = DB::table($tableName)
                        ->whereNotNull($centsField)
                        ->where($centsField, '!=', 0)
                        ->count();
                    
                    $totalCount = DB::table($tableName)->count();
                    
                    $fieldStatus['conversion_complete'] = ($convertedCount > 0);
                    $fieldStatus['converted_records'] = $convertedCount;
                    $fieldStatus['total_records'] = $totalCount;
                    $fieldStatus['conversion_rate'] = $totalCount > 0 ? ($convertedCount / $totalCount * 100) : 0;
                }

                if (!$fieldStatus['conversion_complete']) {
                    $modelStatus['migration_complete'] = false;
                }

                $modelStatus['fields_status'][] = $fieldStatus;
            }

            if ($modelStatus['migration_complete']) {
                $completedModels++;
            }

            $status['models_status'][] = $modelStatus;
        }

        $status['overall_progress'] = $totalModels > 0 ? ($completedModels / $totalModels * 100) : 0;

        return $status;
    }

    /**
     * 回滾金額轉換（僅在測試環境使用）
     * 
     * @return array 回滾結果
     */
    public function rollbackConversion(): array
    {
        if (app()->environment('production')) {
            throw new \Exception('生產環境禁止執行金額轉換回滾');
        }

        $report = [
            'started_at' => now(),
            'models_processed' => [],
        ];

        foreach (self::MODEL_CONFIGS as $modelClass => $config) {
            $tableName = $config['table'];
            $fields = $config['fields'];

            foreach ($fields as $yuanField => $centsField) {
                if (Schema::hasColumn($tableName, $centsField)) {
                    // 將分欄位設為 NULL
                    DB::update("UPDATE {$tableName} SET {$centsField} = NULL");
                }
            }

            $report['models_processed'][] = $modelClass;
        }

        $report['completed_at'] = now();

        Log::warning('金額轉換已回滾（僅限測試環境）', $report);

        return $report;
    }
}