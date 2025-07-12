<?php

namespace App\Console\Commands;

use App\Services\CurrencyMigrationService;
use Illuminate\Console\Command;

class MigrateCurrencyToCents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'currency:migrate-to-cents 
                           {--dry-run : 只顯示將要執行的操作，不實際執行}
                           {--status : 檢查當前轉換狀態}
                           {--rollback : 回滾轉換（僅限非生產環境）}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '統一所有金額欄位使用分為單位儲存';

    /**
     * Execute the console command.
     */
    public function handle(CurrencyMigrationService $migrationService)
    {
        if ($this->option('status')) {
            return $this->showStatus($migrationService);
        }

        if ($this->option('rollback')) {
            return $this->handleRollback($migrationService);
        }

        if ($this->option('dry-run')) {
            return $this->showDryRun($migrationService);
        }

        return $this->performMigration($migrationService);
    }

    /**
     * 顯示當前轉換狀態
     */
    protected function showStatus(CurrencyMigrationService $migrationService)
    {
        $this->info('🔍 檢查金額統一化狀態...');
        
        $status = $migrationService->getConversionStatus();
        
        $this->table(['項目', '狀態'], [
            ['遷移日誌表', $status['migration_log_exists'] ? '✅ 存在' : '❌ 不存在'],
            ['整體進度', sprintf('%.1f%%', $status['overall_progress'])],
        ]);

        $this->info("\n📊 各模型轉換狀態：");
        
        foreach ($status['models_status'] as $modelStatus) {
            $statusIcon = $modelStatus['migration_complete'] ? '✅' : '⏳';
            $this->line("  {$statusIcon} {$modelStatus['model']} ({$modelStatus['table']})");
            
            foreach ($modelStatus['fields_status'] as $fieldStatus) {
                $fieldIcon = $fieldStatus['conversion_complete'] ? '✅' : '❌';
                $centsFieldStatus = $fieldStatus['cents_field_exists'] ? '存在' : '不存在';
                
                if (isset($fieldStatus['conversion_rate'])) {
                    $rate = sprintf('%.1f%%', $fieldStatus['conversion_rate']);
                    $this->line("    {$fieldIcon} {$fieldStatus['yuan_field']} → {$fieldStatus['cents_field']} ({$centsFieldStatus}, 轉換率: {$rate})");
                } else {
                    $this->line("    {$fieldIcon} {$fieldStatus['yuan_field']} → {$fieldStatus['cents_field']} ({$centsFieldStatus})");
                }
            }
        }

        if ($status['overall_progress'] >= 100) {
            $this->info("\n🎉 金額統一化已完成！");
        } else {
            $this->warn("\n⚠️  金額統一化尚未完成，進度：{$status['overall_progress']}%");
        }
    }

    /**
     * 顯示乾運行結果
     */
    protected function showDryRun(CurrencyMigrationService $migrationService)
    {
        $this->info('🔍 乾運行模式：顯示將要執行的操作');
        
        $status = $migrationService->getConversionStatus();
        
        $this->info("\n📋 將要處理的模型：");
        
        foreach ($status['models_status'] as $modelStatus) {
            if (!$modelStatus['migration_complete']) {
                $this->line("  📦 {$modelStatus['model']} ({$modelStatus['table']})");
                
                foreach ($modelStatus['fields_status'] as $fieldStatus) {
                    if (!$fieldStatus['conversion_complete']) {
                        $this->line("    💰 轉換 {$fieldStatus['yuan_field']} → {$fieldStatus['cents_field']}");
                        
                        if (isset($fieldStatus['total_records'])) {
                            $this->line("      📊 預計處理 {$fieldStatus['total_records']} 筆記錄");
                        }
                    }
                }
            }
        }

        $this->info("\n💡 如果要執行實際轉換，請運行：");
        $this->line("  php artisan currency:migrate-to-cents");
    }

    /**
     * 執行實際的金額轉換
     */
    protected function performMigration(CurrencyMigrationService $migrationService)
    {
        $this->info('🚀 開始執行金額統一化...');
        
        if (!$this->confirm('確定要執行金額統一化嗎？這將會修改資料庫中的金額資料。')) {
            $this->info('取消執行。');
            return;
        }

        $progressBar = $this->output->createProgressBar(count(CurrencyMigrationService::MODEL_CONFIGS));
        $progressBar->start();

        try {
            $report = $migrationService->performFullMigration();
            $progressBar->finish();
            
            $this->newLine(2);
            
            if ($report['success']) {
                $this->info('✅ 金額統一化執行成功！');
                
                $this->table(['統計項目', '數值'], [
                    ['處理模型數', count($report['models_processed'])],
                    ['轉換記錄數', $report['total_records_converted']],
                    ['執行時間', $report['duration_seconds'] . ' 秒'],
                    ['開始時間', $report['started_at']->format('Y-m-d H:i:s')],
                    ['完成時間', $report['completed_at']->format('Y-m-d H:i:s')],
                ]);
                
                if (!empty($report['warnings'])) {
                    $this->warn("\n⚠️  警告訊息：");
                    foreach ($report['warnings'] as $warning) {
                        $this->line("  • {$warning}");
                    }
                }
            } else {
                $this->error('❌ 金額統一化執行失敗！');
                
                foreach ($report['errors'] as $error) {
                    $this->error("  模型 {$error['model']} 錯誤：{$error['error']}");
                }
            }
            
        } catch (\Exception $e) {
            $progressBar->finish();
            $this->newLine(2);
            
            $this->error('❌ 執行過程中發生錯誤：' . $e->getMessage());
            $this->line($e->getTraceAsString());
        }
    }

    /**
     * 處理回滾操作
     */
    protected function handleRollback(CurrencyMigrationService $migrationService)
    {
        if (app()->environment('production')) {
            $this->error('❌ 生產環境禁止執行回滾操作！');
            return;
        }

        $this->warn('⚠️  這將回滾所有金額轉換操作！');
        
        if (!$this->confirm('確定要回滾金額統一化嗎？')) {
            $this->info('取消回滾。');
            return;
        }

        try {
            $report = $migrationService->rollbackConversion();
            
            $this->info('✅ 金額轉換回滾完成！');
            $this->table(['項目', '值'], [
                ['處理模型數', count($report['models_processed'])],
                ['開始時間', $report['started_at']->format('Y-m-d H:i:s')],
                ['完成時間', $report['completed_at']->format('Y-m-d H:i:s')],
            ]);
            
        } catch (\Exception $e) {
            $this->error('❌ 回滾失敗：' . $e->getMessage());
        }
    }
}