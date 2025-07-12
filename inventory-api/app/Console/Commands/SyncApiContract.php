<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * API 契約同步命令
 * 
 * 執行完整的 API 契約同步流程：
 * 1. 重新生成 Scribe 文檔
 * 2. 複製 OpenAPI 規格到前端
 * 3. 生成 TypeScript 型別
 * 4. 驗證契約同步狀態
 * 
 * 這個命令確保前後端契約保持同步，是專案架構中定義的標準流程的自動化版本。
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-07-04
 */
class SyncApiContract extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api:sync-contract 
                           {--check : 只檢查契約狀態，不執行同步}
                           {--frontend-path=../inventory-client : 前端專案路徑}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '執行完整的 API 契約同步流程（後端 → OpenAPI → 前端 TypeScript）';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle(): int
    {
        $frontendPath = $this->option('frontend-path');
        $checkOnly = $this->option('check');

        $this->info('🔄 API 契約同步工具');
        $this->newLine();

        if ($checkOnly) {
            return $this->checkContractStatus($frontendPath);
        }

        return $this->syncContract($frontendPath);
    }

    /**
     * 執行完整的契約同步
     */
    private function syncContract(string $frontendPath): int
    {
        $this->info('📋 步驟 1：重新生成 Scribe API 文檔...');
        
        $scribeResult = $this->call('scribe:generate');
        if ($scribeResult !== 0) {
            $this->error('❌ Scribe 文檔生成失敗');
            return self::FAILURE;
        }
        $this->info('✅ Scribe 文檔生成完成');
        $this->newLine();

        $this->info('📋 步驟 2：複製 OpenAPI 規格到前端...');
        
        $openapiSource = storage_path('app/private/scribe/openapi.yaml');
        $openapiTarget = "{$frontendPath}/openapi.yaml";

        if (!file_exists($openapiSource)) {
            $this->error('❌ OpenAPI 規格檔案不存在：' . $openapiSource);
            return self::FAILURE;
        }

        if (!is_dir($frontendPath)) {
            $this->error('❌ 前端專案路徑不存在：' . $frontendPath);
            return self::FAILURE;
        }

        if (!copy($openapiSource, $openapiTarget)) {
            $this->error('❌ 複製 OpenAPI 規格失敗');
            return self::FAILURE;
        }
        $this->info('✅ OpenAPI 規格複製完成');
        $this->newLine();

        $this->info('📋 步驟 3：生成 TypeScript API 型別...');
        
        $currentDir = getcwd();
        chdir($frontendPath);

        $typegenResult = shell_exec('npm run api:types 2>&1');
        chdir($currentDir);

        if (strpos($typegenResult, 'error') !== false || strpos($typegenResult, 'Error') !== false) {
            $this->error('❌ TypeScript 型別生成失敗：');
            $this->line($typegenResult);
            return self::FAILURE;
        }
        $this->info('✅ TypeScript 型別生成完成');
        $this->newLine();

        $this->info('📋 步驟 4：驗證契約同步狀態...');
        $this->checkContractStatus($frontendPath, false);

        $this->info('🎉 API 契約同步完成！');
        $this->newLine();
        
        $this->info('💡 提醒：');
        $this->info('- 前端開發者現在可以使用最新的 TypeScript 型別');
        $this->info('- 如果有新的 API 端點，請確保前端代碼使用新生成的型別');
        $this->info('- 建議執行前端測試確保沒有型別錯誤');

        return self::SUCCESS;
    }

    /**
     * 檢查契約同步狀態
     */
    private function checkContractStatus(string $frontendPath, bool $standalone = true): int
    {
        if ($standalone) {
            $this->info('🔍 檢查 API 契約同步狀態...');
            $this->newLine();
        }

        $issues = [];
        $warnings = [];

        // 檢查後端 OpenAPI 檔案
        $backendOpenapi = storage_path('app/private/scribe/openapi.yaml');
        if (!file_exists($backendOpenapi)) {
            $issues[] = '後端 OpenAPI 規格檔案不存在，請先執行 php artisan scribe:generate';
        } else {
            $backendModified = filemtime($backendOpenapi);
            $this->info("✅ 後端 OpenAPI 規格：" . date('Y-m-d H:i:s', $backendModified));
        }

        // 檢查前端 OpenAPI 檔案
        $frontendOpenapi = "{$frontendPath}/openapi.yaml";
        if (!file_exists($frontendOpenapi)) {
            $issues[] = '前端 OpenAPI 規格檔案不存在，需要同步';
        } else {
            $frontendModified = filemtime($frontendOpenapi);
            $this->info("✅ 前端 OpenAPI 規格：" . date('Y-m-d H:i:s', $frontendModified));

            // 檢查是否同步
            if (isset($backendModified) && $backendModified > $frontendModified) {
                $warnings[] = '前端 OpenAPI 規格較舊，建議重新同步';
            }
        }

        // 檢查前端 TypeScript 型別檔案
        $frontendTypes = "{$frontendPath}/src/types/api.ts";
        if (!file_exists($frontendTypes)) {
            $issues[] = '前端 TypeScript 型別檔案不存在，需要生成';
        } else {
            $typesModified = filemtime($frontendTypes);
            $this->info("✅ 前端 TypeScript 型別：" . date('Y-m-d H:i:s', $typesModified));

            // 檢查型別是否為最新
            if (isset($frontendModified) && $frontendModified > $typesModified) {
                $warnings[] = 'TypeScript 型別較舊，建議重新生成';
            }
        }

        // 檢查關鍵 API 的文檔品質
        $this->checkApiDocumentationQuality($warnings);

        $this->newLine();

        if (!empty($issues)) {
            $this->error('❌ 發現嚴重問題：');
            foreach ($issues as $issue) {
                $this->error("  - {$issue}");
            }
        }

        if (!empty($warnings)) {
            $this->warn('⚠️  發現警告：');
            foreach ($warnings as $warning) {
                $this->warn("  - {$warning}");
            }
        }

        if (empty($issues) && empty($warnings)) {
            $this->info('✅ API 契約同步狀態良好');
        }

        if ($standalone) {
            $this->newLine();
            if (!empty($issues) || !empty($warnings)) {
                $this->info('💡 執行 php artisan api:sync-contract 來同步契約');
            }
        }

        return empty($issues) ? self::SUCCESS : self::FAILURE;
    }

    /**
     * 檢查關鍵 API 的文檔品質
     */
    private function checkApiDocumentationQuality(array &$warnings): void
    {
        // 檢查進貨單狀態更新 API
        try {
            $reflection = new \ReflectionClass(\App\Http\Controllers\Api\PurchaseController::class);
            $method = $reflection->getMethod('updateStatus');
            $docComment = $method->getDocComment();

            if ($docComment) {
                // 檢查是否包含重要的業務邏輯說明
                $hasBusinessLogic = str_contains($docComment, '業務邏輯副作用') || 
                                   str_contains($docComment, '庫存') ||
                                   str_contains($docComment, 'inventory');
                
                if (!$hasBusinessLogic) {
                    $warnings[] = 'PurchaseController::updateStatus 缺少業務邏輯副作用說明';
                }

                $hasTransactionInfo = str_contains($docComment, '事務') || 
                                     str_contains($docComment, 'transaction');
                
                if (!$hasTransactionInfo) {
                    $warnings[] = 'PurchaseController::updateStatus 缺少事務保證說明';
                }
            } else {
                $warnings[] = 'PurchaseController::updateStatus 缺少文檔註解';
            }

        } catch (\ReflectionException $e) {
            $warnings[] = '無法檢查 PurchaseController::updateStatus 的文檔品質';
        }
    }
}