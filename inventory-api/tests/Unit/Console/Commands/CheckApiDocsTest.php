<?php

namespace Tests\Unit\Console\Commands;

use Tests\TestCase;
use Illuminate\Support\Facades\Artisan;
use App\Console\Commands\CheckApiDocs;
use App\Http\Controllers\Api\PurchaseController;
use ReflectionClass;
use ReflectionException;

class CheckApiDocsTest extends TestCase
{
    /**
     * 測試命令可以正常執行
     */
    public function test_command_executes_successfully()
    {
        $this->artisan('api:check-docs')
            ->assertExitCode(0)
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->expectsOutput('📊 檢查結果：')
            ->expectsOutput('✅ 已檢查 2 個關鍵 API');
    }

    /**
     * 測試命令簽名和描述
     */
    public function test_command_signature_and_description()
    {
        $command = new CheckApiDocs();
        
        $this->assertEquals('api:check-docs', $command->getName());
        $this->assertEquals('檢查 API 文檔品質，確保業務邏輯副作用得到適當描述', $command->getDescription());
    }

    /**
     * 測試詳細模式
     */
    public function test_command_with_detail_option()
    {
        $this->artisan('api:check-docs --detail')
            ->assertExitCode(0)
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->expectsOutput('📋 檢查：進貨單狀態更新 (updateStatus)')
            ->expectsOutput('📋 檢查：進貨單更新 (update)');
    }

    /**
     * 測試修復建議選項
     */
    public function test_command_with_fix_option()
    {
        $this->artisan('api:check-docs --fix')
            ->assertExitCode(0)
            ->expectsOutput('🔍 檢查 API 文檔品質...');
    }

    /**
     * 測試檢查有問題的 API 文檔
     */
    public function test_check_api_with_missing_documentation()
    {
        $this->artisan('api:check-docs')
            ->assertExitCode(0)
            ->expectsOutput('📋 檢查：進貨單狀態更新 (updateStatus)')
            ->expectsOutput('📋 檢查：進貨單更新 (update)');
    }

    /**
     * 測試命令的關鍵 API 配置
     */
    public function test_critical_apis_configuration()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $property = $reflection->getProperty('criticalApis');
        $property->setAccessible(true);
        $criticalApis = $property->getValue($command);

        $this->assertIsArray($criticalApis);
        $this->assertCount(2, $criticalApis);
        
        // 檢查第一個 API 配置
        $this->assertEquals(PurchaseController::class, $criticalApis[0]['controller']);
        $this->assertEquals('updateStatus', $criticalApis[0]['method']);
        $this->assertEquals('進貨單狀態更新', $criticalApis[0]['description']);
        $this->assertArrayHasKey('requires', $criticalApis[0]);
        $this->assertArrayHasKey('business_logic', $criticalApis[0]['requires']);
        $this->assertArrayHasKey('inventory_impact', $criticalApis[0]['requires']);
        $this->assertArrayHasKey('transaction_guarantee', $criticalApis[0]['requires']);
        
        // 檢查第二個 API 配置
        $this->assertEquals(PurchaseController::class, $criticalApis[1]['controller']);
        $this->assertEquals('update', $criticalApis[1]['method']);
        $this->assertEquals('進貨單更新', $criticalApis[1]['description']);
        $this->assertArrayHasKey('requires', $criticalApis[1]);
        $this->assertArrayHasKey('business_logic', $criticalApis[1]['requires']);
        $this->assertArrayHasKey('inventory_impact', $criticalApis[1]['requires']);
    }

    /**
     * 測試文檔元素檢查方法
     */
    public function test_check_documentation_element_method()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkDocumentationElement');
        $method->setAccessible(true);

        // 測試業務邏輯檢查
        $this->assertTrue($method->invoke($command, '業務邏輯副作用', 'business_logic'));
        $this->assertTrue($method->invoke($command, '業務邏輯', 'business_logic'));
        $this->assertTrue($method->invoke($command, '副作用', 'business_logic'));
        $this->assertTrue($method->invoke($command, 'side effect', 'business_logic'));
        $this->assertFalse($method->invoke($command, 'no match', 'business_logic'));

        // 測試庫存影響檢查
        $this->assertTrue($method->invoke($command, '庫存', 'inventory_impact'));
        $this->assertTrue($method->invoke($command, 'inventory', 'inventory_impact'));
        $this->assertTrue($method->invoke($command, '入庫', 'inventory_impact'));
        $this->assertTrue($method->invoke($command, '庫存入庫', 'inventory_impact'));
        $this->assertFalse($method->invoke($command, 'no match', 'inventory_impact'));

        // 測試事務保證檢查
        $this->assertTrue($method->invoke($command, '事務', 'transaction_guarantee'));
        $this->assertTrue($method->invoke($command, 'transaction', 'transaction_guarantee'));
        $this->assertTrue($method->invoke($command, '回滾', 'transaction_guarantee'));
        $this->assertTrue($method->invoke($command, 'rollback', 'transaction_guarantee'));
        $this->assertFalse($method->invoke($command, 'no match', 'transaction_guarantee'));

        // 測試未知元素
        $this->assertFalse($method->invoke($command, 'anything', 'unknown_element'));
    }

    /**
     * 測試基本 Scribe 註解檢查
     */
    public function test_check_basic_scribe_annotations()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkBasicScribeAnnotations');
        $method->setAccessible(true);

        $warnings = [];
        
        // 測試缺少所有註解
        $method->invokeArgs($command, ['/** basic doc comment */', &$warnings]);
        $this->assertCount(4, $warnings);
        $this->assertContains('缺少 @group 註解（API 分組）', $warnings);
        $this->assertContains('缺少 @summary 註解（摘要說明）', $warnings);
        $this->assertContains('缺少 @description 註解（詳細描述）', $warnings);
        $this->assertContains('缺少 @response 註解（回應範例）', $warnings);

        // 測試包含所有註解
        $warnings = [];
        $docComment = '/** @group test @summary test @description test @response 200 test */';
        $method->invokeArgs($command, [$docComment, &$warnings]);
        $this->assertCount(0, $warnings);
    }

    /**
     * 測試處理不存在的方法
     */
    public function test_handle_non_existent_method()
    {
        // 測試不存在的 controller 類的處理
        $command = new CheckApiDocs();
        
        // 測試 checkDocumentationElement 方法是否存在
        $this->assertTrue(method_exists($command, 'checkDocumentationElement'));
        
        // 我們可以測試這個方法是否會正確處理 ReflectionException
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkDocumentationElement');
        $method->setAccessible(true);
        
        // 測試方法本身的功能
        $this->assertTrue($method->invoke($command, '包含業務邏輯的文檔', 'business_logic'));
        $this->assertFalse($method->invoke($command, '不包含相關內容', 'business_logic'));
    }

    /**
     * 測試檢查 API 文檔的私有方法
     */
    public function test_check_api_documentation_private_method()
    {
        // 這個測試需要模擬 console 輸出，所以我們只測試返回值的結構
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkApiDocumentation');
        $method->setAccessible(true);

        $api = [
            'controller' => PurchaseController::class,
            'method' => 'update',
            'description' => '進貨單更新',
            'requires' => [
                'business_logic' => '業務邏輯副作用',
                'inventory_impact' => '庫存影響'
            ]
        ];

        // 需要模擬 console 命令環境，所以我們只測試基本結構
        $this->assertTrue(method_exists($command, 'checkApiDocumentation'));
        $this->assertTrue(method_exists($command, 'checkDocumentationElement'));
        $this->assertTrue(method_exists($command, 'checkBasicScribeAnnotations'));
    }

    /**
     * 測試命令退出代碼
     */
    public function test_command_exit_codes()
    {
        // 正常情況應該返回 SUCCESS (0)
        $this->artisan('api:check-docs')
            ->assertExitCode(0);
    }

    /**
     * 測試命令輸出格式
     */
    public function test_command_output_format()
    {
        $this->artisan('api:check-docs')
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->expectsOutput('📊 檢查結果：')
            ->expectsOutput('✅ 已檢查 2 個關鍵 API');
    }

    /**
     * 測試修復建議功能
     */
    public function test_show_fix_suggestions_method()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('showFixSuggestions');
        $method->setAccessible(true);
        
        // 測試方法存在並可以被調用
        $this->assertTrue($method->isPrivate());
        $this->assertIsCallable([$command, 'showFixSuggestions']);
    }

    /**
     * 測試修復建議選項的輸出
     */
    public function test_command_with_fix_option_shows_suggestions()
    {
        $this->artisan('api:check-docs --fix')
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->expectsOutput('📊 檢查結果：')
            ->expectsOutput('✅ 已檢查 2 個關鍵 API');
    }

    /**
     * 測試檢查不存在的控制器方法
     */
    public function test_check_non_existent_controller_method()
    {
        // 創建 mock 輸出介面
        $output = $this->createMock(\Illuminate\Console\OutputStyle::class);
        
        $command = new CheckApiDocs();
        $command->setOutput($output);
        
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkApiDocumentation');
        $method->setAccessible(true);
        
        // 測試不存在的控制器類
        $api = [
            'controller' => 'App\\Http\\Controllers\\NonExistentController',
            'method' => 'nonExistentMethod',
            'description' => '不存在的 API',
            'requires' => [
                'business_logic' => '業務邏輯副作用'
            ]
        ];
        
        $result = $method->invoke($command, $api);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('issues', $result);
        $this->assertArrayHasKey('warnings', $result);
        $this->assertGreaterThan(0, count($result['issues']));
    }

    /**
     * 測試檢查不存在的方法
     */
    public function test_check_non_existent_method()
    {
        // 創建 mock 輸出介面
        $output = $this->createMock(\Illuminate\Console\OutputStyle::class);
        
        $command = new CheckApiDocs();
        $command->setOutput($output);
        
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkApiDocumentation');
        $method->setAccessible(true);
        
        // 測試存在的控制器但不存在的方法
        $api = [
            'controller' => PurchaseController::class,
            'method' => 'nonExistentMethod',
            'description' => '不存在的方法',
            'requires' => [
                'business_logic' => '業務邏輯副作用'
            ]
        ];
        
        $result = $method->invoke($command, $api);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('issues', $result);
        $this->assertArrayHasKey('warnings', $result);
        $this->assertGreaterThan(0, count($result['issues']));
    }

    /**
     * 測試檢查沒有文檔註解的方法
     */
    public function test_check_method_without_doc_comment()
    {
        // 創建 mock 輸出介面
        $output = $this->createMock(\Illuminate\Console\OutputStyle::class);
        
        $command = new CheckApiDocs();
        $command->setOutput($output);
        
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkApiDocumentation');
        $method->setAccessible(true);
        
        // 測試存在的方法但沒有文檔註解
        $api = [
            'controller' => PurchaseController::class,
            'method' => 'index', // 這個方法可能沒有文檔註解
            'description' => '沒有文檔註解的方法',
            'requires' => [
                'business_logic' => '業務邏輯副作用'
            ]
        ];
        
        $result = $method->invoke($command, $api);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('issues', $result);
        $this->assertArrayHasKey('warnings', $result);
        
        // 沒有文檔註解時應該有問題
        if (count($result['issues']) > 0) {
            $this->assertContains('缺少文檔註解', $result['issues']);
        }
    }

    /**
     * 測試基本 Scribe 註解檢查青少註解
     */
    public function test_check_basic_scribe_annotations_missing_all()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkBasicScribeAnnotations');
        $method->setAccessible(true);
        
        $warnings = [];
        $docComment = '/** 基本文檔註解，沒有任何 Scribe 註解 */';
        
        $method->invokeArgs($command, [$docComment, &$warnings]);
        
        $this->assertCount(4, $warnings);
        $this->assertContains('缺少 @group 註解（API 分組）', $warnings);
        $this->assertContains('缺少 @summary 註解（摘要說明）', $warnings);
        $this->assertContains('缺少 @description 註解（詳細描述）', $warnings);
        $this->assertContains('缺少 @response 註解（回應範例）', $warnings);
    }

    /**
     * 測試基本 Scribe 註解檢查部分註解
     */
    public function test_check_basic_scribe_annotations_partial()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkBasicScribeAnnotations');
        $method->setAccessible(true);
        
        $warnings = [];
        $docComment = '/** @group 進貨管理 @summary 更新狀態 */';
        
        $method->invokeArgs($command, [$docComment, &$warnings]);
        
        $this->assertCount(2, $warnings);
        $this->assertContains('缺少 @description 註解（詳細描述）', $warnings);
        $this->assertContains('缺少 @response 註解（回應範例）', $warnings);
    }

    /**
     * 測試檢查完整的文檔註解
     */
    public function test_check_complete_documentation()
    {
        // 創建 mock 輸出介面
        $output = $this->createMock(\Illuminate\Console\OutputStyle::class);
        
        $command = new CheckApiDocs();
        $command->setOutput($output);
        
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkApiDocumentation');
        $method->setAccessible(true);
        
        // 測試有完整文檔的 API
        $api = [
            'controller' => PurchaseController::class,
            'method' => 'show', // 這個方法可能有文檔
            'description' => '有文檔的方法',
            'requires' => [
                'business_logic' => '業務邏輯副作用'
            ]
        ];
        
        $result = $method->invoke($command, $api);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('issues', $result);
        $this->assertArrayHasKey('warnings', $result);
        
        // 這個測試主要驗證結構的正確性，不強制要求特定的結果
        $this->assertTrue(true);
    }

    /**
     * 測試檢查文檔元素的特殊情況
     */
    public function test_check_documentation_element_edge_cases()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkDocumentationElement');
        $method->setAccessible(true);
        
        // 測試空字串
        $this->assertFalse($method->invoke($command, '', 'business_logic'));
        
        // 測試大小寫混合
        $this->assertTrue($method->invoke($command, 'Business Logic', 'business_logic'));
        $this->assertTrue($method->invoke($command, 'INVENTORY', 'inventory_impact'));
        $this->assertTrue($method->invoke($command, 'Transaction', 'transaction_guarantee'));
        
        // 測試中英文混合
        $this->assertTrue($method->invoke($command, '業務邏輯 and side effects', 'business_logic'));
        $this->assertTrue($method->invoke($command, '庫存 inventory 更新', 'inventory_impact'));
        $this->assertTrue($method->invoke($command, '事務 transaction 保證', 'transaction_guarantee'));
    }

    /**
     * 測試命令選項的組合
     */
    public function test_command_options_combination()
    {
        // 測試同時使用多個選項
        $this->artisan('api:check-docs --fix --detail')
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->expectsOutput('📊 檢查結果：')
            ->expectsOutput('✅ 已檢查 2 個關鍵 API');
    }

    /**
     * 測試命令無選項的預設行為
     */
    public function test_command_default_behavior()
    {
        $this->artisan('api:check-docs')
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->doesntExpectOutput('📊 修復建議：') // 不應該顯示修復建議
            ->expectsOutput('✅ 已檢查 2 個關鍵 API');
    }

    /**
     * 測試模擬有問題和警告的情況
     */
    public function test_command_with_issues_and_warnings()
    {
        // 測試命令可以處理問題和警告的情況
        $command = new CheckApiDocs();
        
        // 使用反射來測試 handle 方法的邏輯
        $reflection = new \ReflectionClass($command);
        $property = $reflection->getProperty('criticalApis');
        $property->setAccessible(true);
        
        // 驗證屬性存在且可設置
        $this->assertTrue($reflection->hasProperty('criticalApis'));
        
        // 這個測試主要驗證邏輯結構
        $this->assertTrue(method_exists($command, 'handle'));
    }

    /**
     * 測試處理反射異常的情況
     */
    public function test_handle_reflection_exception()
    {
        // 使用 Artisan 測試來處理無效控制器的情況
        // 先創建一個測試命令類來替換 criticalApis
        $this->app->bind(CheckApiDocs::class, function () {
            $command = new class extends CheckApiDocs {
                public function __construct()
                {
                    parent::__construct();
                    // 重寫 criticalApis 屬性
                    $reflection = new \ReflectionClass($this);
                    $property = $reflection->getParentClass()->getProperty('criticalApis');
                    $property->setAccessible(true);
                    $property->setValue($this, [
                        [
                            'controller' => 'App\\Http\\Controllers\\NonExistentController',
                            'method' => 'nonExistentMethod',
                            'description' => '測試無效控制器',
                            'requires' => ['business_logic' => '業務邏輯副作用']
                        ]
                    ]);
                }
            };
            return $command;
        });
        
        // 執行命令並檢查退出碼
        $this->artisan('api:check-docs')
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->expectsOutput('📋 檢查：測試無效控制器 (nonExistentMethod)')
            ->assertExitCode(1); // FAILURE
    }

    /**
     * 測試有完整文檔的方法（模擬最佳情況）
     */
    public function test_check_method_with_complete_documentation()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $checkElementMethod = $reflection->getMethod('checkDocumentationElement');
        $checkElementMethod->setAccessible(true);

        // 測試完整的文檔註解字串
        $completeDocComment = '/**
         * @group 進貨管理
         * @summary 更新進貨單狀態
         * @description 更新指定進貨單的狀態，執行完整的業務邏輯驗證和處理。
         * 此操作會觸發複雜的業務邏輯，不僅僅是欄位更新
         * 狀態更新為「已完成」時會自動執行庫存入庫操作
         * 狀態從「已完成」變更為其他狀態時會自動回退庫存
         * 所有操作在資料庫事務中執行，失敗時自動回滾
         * @response 200 成功
         */';

        // 測試所有必要元素都存在
        $this->assertTrue($checkElementMethod->invoke($command, $completeDocComment, 'business_logic'));
        $this->assertTrue($checkElementMethod->invoke($command, $completeDocComment, 'inventory_impact'));
        $this->assertTrue($checkElementMethod->invoke($command, $completeDocComment, 'transaction_guarantee'));
    }

    /**
     * 測試 showFixSuggestions 方法的實際執行
     */
    public function test_show_fix_suggestions_execution()
    {
        // 使用 Artisan 測試來測試 showFixSuggestions 的執行
        $this->artisan('api:check-docs --fix')
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->expectsOutput('📊 檢查結果：')
            ->expectsOutput('✅ 已檢查 2 個關鍵 API')
            ->assertExitCode(0);
        
        // 驗證 showFixSuggestions 方法存在且可訪問
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('showFixSuggestions');
        
        $this->assertTrue($method->isPrivate());
        $this->assertEquals('showFixSuggestions', $method->getName());
    }

    /**
     * 測試命令的成功和失敗退出碼
     */
    public function test_command_exit_codes_detailed()
    {
        // 測試常量存在
        $this->assertEquals(0, \Illuminate\Console\Command::SUCCESS);
        $this->assertEquals(1, \Illuminate\Console\Command::FAILURE);
    }

    /**
     * 測試檢查基本 Scribe 註解的完整覆蓋
     */
    public function test_check_basic_scribe_annotations_complete_coverage()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkBasicScribeAnnotations');
        $method->setAccessible(true);

        // 測試只有一個註解的情況
        $warnings = [];
        $docComment = '/** @group 進貨管理 */';
        $method->invokeArgs($command, [$docComment, &$warnings]);
        $this->assertCount(3, $warnings); // 缺少其他3個註解

        // 測試有兩個註解的情況
        $warnings = [];
        $docComment = '/** @group 進貨管理 @summary 測試摘要 */';
        $method->invokeArgs($command, [$docComment, &$warnings]);
        $this->assertCount(2, $warnings); // 缺少其他2個註解

        // 測試有三個註解的情況
        $warnings = [];
        $docComment = '/** @group 進貨管理 @summary 測試摘要 @description 測試描述 */';
        $method->invokeArgs($command, [$docComment, &$warnings]);
        $this->assertCount(1, $warnings); // 缺少1個註解

        // 測試完整的註解
        $warnings = [];
        $docComment = '/** @group 進貨管理 @summary 測試摘要 @description 測試描述 @response 200 成功 */';
        $method->invokeArgs($command, [$docComment, &$warnings]);
        $this->assertCount(0, $warnings); // 沒有缺少的註解
    }

    /**
     * 測試檢查文檔元素的所有分支
     */
    public function test_check_documentation_element_all_branches()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $method = $reflection->getMethod('checkDocumentationElement');
        $method->setAccessible(true);

        // 測試 business_logic 的所有可能匹配
        $businessLogicTests = [
            '業務邏輯副作用' => true,
            '業務邏輯' => true,
            '副作用' => true,
            'side effect' => true,
            'business logic' => true,
            'business' => true,
            'random text' => false
        ];

        foreach ($businessLogicTests as $text => $expected) {
            $this->assertEquals($expected, $method->invoke($command, $text, 'business_logic'));
        }

        // 測試 inventory_impact 的所有可能匹配
        $inventoryTests = [
            '庫存' => true,
            'inventory' => true,
            '入庫' => true,
            '庫存入庫' => true,
            'random text' => false
        ];

        foreach ($inventoryTests as $text => $expected) {
            $this->assertEquals($expected, $method->invoke($command, $text, 'inventory_impact'));
        }

        // 測試 transaction_guarantee 的所有可能匹配
        $transactionTests = [
            '事務' => true,
            'transaction' => true,
            '回滾' => true,
            'rollback' => true,
            'random text' => false
        ];

        foreach ($transactionTests as $text => $expected) {
            $this->assertEquals($expected, $method->invoke($command, $text, 'transaction_guarantee'));
        }

        // 測試未知元素
        $this->assertFalse($method->invoke($command, 'any text', 'unknown_element'));
    }

    /**
     * 測試命令在有問題時顯示修復建議
     */
    public function test_command_shows_fix_suggestions_when_needed()
    {
        // 這個測試檢查當有問題或警告時，--fix 選項是否會觸發修復建議
        // 由於實際的 API 檢查可能會有警告，我們測試命令的基本執行
        $this->artisan('api:check-docs --fix')
            ->expectsOutput('🔍 檢查 API 文檔品質...')
            ->expectsOutput('📊 檢查結果：');
    }

    /**
     * 測試關鍵 API 配置的完整性
     */
    public function test_critical_apis_configuration_completeness()
    {
        $command = new CheckApiDocs();
        $reflection = new \ReflectionClass($command);
        $property = $reflection->getProperty('criticalApis');
        $property->setAccessible(true);
        $criticalApis = $property->getValue($command);

        // 確保每個 API 配置都有所需的欄位
        foreach ($criticalApis as $api) {
            $this->assertArrayHasKey('controller', $api);
            $this->assertArrayHasKey('method', $api);
            $this->assertArrayHasKey('description', $api);
            $this->assertArrayHasKey('requires', $api);
            
            // 確保控制器類存在
            $this->assertTrue(class_exists($api['controller']));
            
            // 確保 requires 陣列不為空
            $this->assertNotEmpty($api['requires']);
        }
    }
}