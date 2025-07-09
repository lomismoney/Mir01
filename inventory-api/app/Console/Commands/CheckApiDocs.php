<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * API 文檔品質檢查命令
 * 
 * 檢查關鍵 API 端點的文檔品質，確保業務邏輯副作用得到適當描述。
 * 這有助於確保 Scribe 生成的 OpenAPI 規格包含足夠的業務邏輯資訊，
 * 從而讓前端開發者了解 API 的真實行為。
 * 
 * @author Claude Code Assistant
 * @version 1.0
 * @since 2025-07-04
 */
class CheckApiDocs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api:check-docs 
                           {--fix : 顯示修復建議}
                           {--detail : 顯示詳細資訊}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '檢查 API 文檔品質，確保業務邏輯副作用得到適當描述';

    /**
     * 需要檢查的關鍵 API 端點
     */
    private array $criticalApis = [
        [
            'controller' => \App\Http\Controllers\Api\PurchaseController::class,
            'method' => 'updateStatus',
            'description' => '進貨單狀態更新',
            'requires' => [
                'business_logic' => '業務邏輯副作用',
                'inventory_impact' => '庫存影響',
                'transaction_guarantee' => '事務保證'
            ]
        ],
        [
            'controller' => \App\Http\Controllers\Api\PurchaseController::class,
            'method' => 'update',
            'description' => '進貨單更新',
            'requires' => [
                'business_logic' => '業務邏輯副作用',
                'inventory_impact' => '庫存影響'
            ]
        ]
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 檢查 API 文檔品質...');
        $this->newLine();

        $totalIssues = 0;
        $totalWarnings = 0;

        foreach ($this->criticalApis as $api) {
            $result = $this->checkApiDocumentation($api);
            $totalIssues += count($result['issues']);
            $totalWarnings += count($result['warnings']);
        }

        $this->newLine();
        $this->info("📊 檢查結果：");
        $this->info("✅ 已檢查 " . count($this->criticalApis) . " 個關鍵 API");
        
        if ($totalIssues > 0) {
            $this->error("❌ 發現 {$totalIssues} 個問題");
        }
        
        if ($totalWarnings > 0) {
            $this->warn("⚠️  發現 {$totalWarnings} 個警告");
        }

        if ($totalIssues === 0 && $totalWarnings === 0) {
            $this->info("🎉 所有檢查都通過！");
        }

        if ($this->option('fix') && ($totalIssues > 0 || $totalWarnings > 0)) {
            $this->newLine();
            $this->showFixSuggestions();
        }

        return $totalIssues > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * 檢查單個 API 的文檔品質
     */
    private function checkApiDocumentation(array $api): array
    {
        $issues = [];
        $warnings = [];

        $this->info("📋 檢查：{$api['description']} ({$api['method']})");

        try {
            $reflection = new \ReflectionClass($api['controller']);
            $method = $reflection->getMethod($api['method']);
            $docComment = $method->getDocComment();

            if (!$docComment) {
                $issues[] = '缺少文檔註解';
                $this->error("  ❌ 缺少文檔註解");
                return ['issues' => $issues, 'warnings' => $warnings];
            }

            // 檢查必要的文檔元素
            foreach ($api['requires'] as $key => $description) {
                $hasElement = $this->checkDocumentationElement($docComment, $key);
                
                if (!$hasElement) {
                    $warnings[] = "缺少{$description}說明";
                    $this->warn("  ⚠️  缺少{$description}說明");
                } else {
                    if ($this->option('detail')) {
                        $this->info("  ✅ 包含{$description}說明");
                    }
                }
            }

            // 檢查基本 Scribe 註解
            $this->checkBasicScribeAnnotations($docComment, $warnings);

            if (empty($issues) && empty($warnings)) {
                $this->info("  ✅ 文檔品質良好");
            }

        } catch (\ReflectionException $e) {
            $issues[] = "無法檢查方法：{$e->getMessage()}";
            $this->error("  ❌ 無法檢查方法：{$e->getMessage()}");
        }

        return ['issues' => $issues, 'warnings' => $warnings];
    }

    /**
     * 檢查文檔是否包含特定元素
     */
    private function checkDocumentationElement(string $docComment, string $element): bool
    {
        switch ($element) {
            case 'business_logic':
                return str_contains($docComment, '業務邏輯副作用') ||
                       str_contains($docComment, '業務邏輯') ||
                       str_contains($docComment, '副作用') ||
                       str_contains($docComment, 'side effect');

            case 'inventory_impact':
                return str_contains($docComment, '庫存') ||
                       str_contains($docComment, 'inventory') ||
                       str_contains($docComment, '入庫') ||
                       str_contains($docComment, '庫存入庫');

            case 'transaction_guarantee':
                return str_contains($docComment, '事務') ||
                       str_contains($docComment, 'transaction') ||
                       str_contains($docComment, '回滾') ||
                       str_contains($docComment, 'rollback');

            default:
                return false;
        }
    }

    /**
     * 檢查基本的 Scribe 註解
     */
    private function checkBasicScribeAnnotations(string $docComment, array &$warnings): void
    {
        $requiredAnnotations = [
            '@group' => 'API 分組',
            '@summary' => '摘要說明',
            '@description' => '詳細描述',
            '@response' => '回應範例'
        ];

        foreach ($requiredAnnotations as $annotation => $description) {
            if (!str_contains($docComment, $annotation)) {
                $warnings[] = "缺少 {$annotation} 註解（{$description}）";
            }
        }
    }

    /**
     * 顯示修復建議
     */
    private function showFixSuggestions(): void
    {
        $this->info("💡 修復建議：");
        $this->newLine();

        $this->info("1. **進貨單狀態更新 API** 應包含以下說明：");
        $this->line("   - 業務邏輯副作用：說明狀態變更會觸發庫存操作");
        $this->line("   - 庫存影響：明確說明何時會增加/減少庫存");
        $this->line("   - 事務保證：說明操作的原子性和一致性保證");
        $this->newLine();

        $this->info("2. **建議的文檔模板**：");
        $this->line("```php");
        $this->line("/**");
        $this->line(" * Update the status of the specified purchase.");
        $this->line(" * ");
        $this->line(" * @group 進貨管理");
        $this->line(" * @authenticated");
        $this->line(" * @summary 更新進貨單狀態");
        $this->line(" * @description 更新指定進貨單的狀態，執行完整的業務邏輯驗證和處理。");
        $this->line(" * ");
        $this->line(" * **⚠️ 重要說明**：");
        $this->line(" * - 此操作會觸發複雜的業務邏輯，不僅僅是欄位更新");
        $this->line(" * - 狀態更新為「已完成」時會自動執行庫存入庫操作");
        $this->line(" * - 狀態從「已完成」變更為其他狀態時會自動回退庫存");
        $this->line(" * - 所有操作在資料庫事務中執行，失敗時自動回滾");
        $this->line(" * ");
        $this->line(" * @urlParam purchase integer required 進貨單ID Example: 1");
        $this->line(" * @bodyParam status string required 新狀態 Example: completed");
        $this->line(" * ");
        $this->line(" * @response 200 scenario=\"成功更新狀態\" {\"data\": {...}}");
        $this->line(" * @response 422 scenario=\"狀態轉換不合法\" {\"message\": \"無法轉換狀態\"}");
        $this->line(" * @response 500 scenario=\"系統錯誤\" {\"message\": \"操作失敗\"}");
        $this->line(" */");
        $this->line("```");
        $this->newLine();

        $this->info("3. **執行同步**：");
        $this->line("   更新文檔後，請執行：");
        $this->line("   php artisan api:sync-contract");
        $this->newLine();

        $this->info("4. **驗證結果**：");
        $this->line("   檢查前端生成的 TypeScript 型別是否包含業務邏輯資訊");
    }
}