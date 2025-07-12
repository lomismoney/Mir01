<?php

namespace Tests\Unit\Docs\Strategies;

use Tests\TestCase;
use App\Docs\Strategies\ForceIntegerIds;
use Knuckles\Camel\Extraction\ExtractedEndpointData;
use Knuckles\Scribe\Extracting\ParamHelpers;
use Knuckles\Scribe\Tools\DocumentationConfig;

class ForceIntegerIdsTest extends TestCase
{
    /**
     * 創建策略實例
     */
    private function createStrategy(): ForceIntegerIds
    {
        $config = $this->createMock(DocumentationConfig::class);
        return new ForceIntegerIds($config);
    }
    /**
     * 測試策略類別可以被實例化
     */
    public function test_strategy_can_be_instantiated()
    {
        $strategy = $this->createStrategy();
        $this->assertInstanceOf(ForceIntegerIds::class, $strategy);
    }

    /**
     * 測試策略使用 ParamHelpers trait
     */
    public function test_strategy_uses_param_helpers_trait()
    {
        $strategy = $this->createStrategy();
        $this->assertContains(ParamHelpers::class, class_uses($strategy));
    }

    /**
     * 測試策略繼承自 Strategy 類別
     */
    public function test_strategy_extends_strategy_class()
    {
        $strategy = $this->createStrategy();
        $this->assertInstanceOf(\Knuckles\Scribe\Extracting\Strategies\Strategy::class, $strategy);
    }

    /**
     * 測試 __invoke 方法存在
     */
    public function test_invoke_method_exists()
    {
        $strategy = $this->createStrategy();
        $this->assertTrue(method_exists($strategy, '__invoke'));
    }

    /**
     * 測試 __invoke 方法可以被調用
     */
    public function test_invoke_method_can_be_called()
    {
        $strategy = $this->createStrategy();
        
        // 創建一個模擬的 ExtractedEndpointData
        $endpointData = $this->createMock(ExtractedEndpointData::class);
        
        // 調用 __invoke 方法
        $result = $strategy($endpointData, []);
        
        // 驗證返回值是數組
        $this->assertIsArray($result);
    }

    /**
     * 測試 __invoke 方法返回空數組
     */
    public function test_invoke_method_returns_empty_array()
    {
        $strategy = $this->createStrategy();
        
        // 創建一個模擬的 ExtractedEndpointData
        $endpointData = $this->createMock(ExtractedEndpointData::class);
        
        // 調用 __invoke 方法
        $result = $strategy($endpointData, []);
        
        // 驗證返回空數組
        $this->assertEquals([], $result);
    }

    /**
     * 測試 __invoke 方法接受設置參數
     */
    public function test_invoke_method_accepts_settings()
    {
        $strategy = $this->createStrategy();
        
        // 創建一個模擬的 ExtractedEndpointData
        $endpointData = $this->createMock(ExtractedEndpointData::class);
        
        // 測試各種設置
        $settings = [
            'test_setting' => 'test_value',
            'another_setting' => 123
        ];
        
        // 調用 __invoke 方法
        $result = $strategy($endpointData, $settings);
        
        // 驗證返回值是數組
        $this->assertIsArray($result);
        $this->assertEquals([], $result);
    }

    /**
     * 測試 __invoke 方法使用預設設置
     */
    public function test_invoke_method_with_default_settings()
    {
        $strategy = $this->createStrategy();
        
        // 創建一個模擬的 ExtractedEndpointData
        $endpointData = $this->createMock(ExtractedEndpointData::class);
        
        // 不提供設置參數
        $result = $strategy($endpointData);
        
        // 驗證返回值是數組
        $this->assertIsArray($result);
        $this->assertEquals([], $result);
    }

    /**
     * 測試策略類別的方法簽名
     */
    public function test_invoke_method_signature()
    {
        $reflection = new \ReflectionClass(ForceIntegerIds::class);
        $method = $reflection->getMethod('__invoke');
        
        // 檢查方法是公開的
        $this->assertTrue($method->isPublic());
        
        // 檢查參數數量
        $this->assertEquals(2, $method->getNumberOfParameters());
        
        // 檢查第一個參數
        $params = $method->getParameters();
        $this->assertEquals('endpointData', $params[0]->getName());
        $this->assertEquals(ExtractedEndpointData::class, $params[0]->getType()->getName());
        
        // 檢查第二個參數
        $this->assertEquals('settings', $params[1]->getName());
        $this->assertTrue($params[1]->hasType());
        $this->assertEquals('array', $params[1]->getType()->getName());
        $this->assertTrue($params[1]->isDefaultValueAvailable());
    }

    /**
     * 測試策略類別的返回類型
     */
    public function test_invoke_method_return_type()
    {
        $reflection = new \ReflectionClass(ForceIntegerIds::class);
        $method = $reflection->getMethod('__invoke');
        
        // 檢查返回類型
        $returnType = $method->getReturnType();
        $this->assertNotNull($returnType);
        $this->assertTrue($returnType->allowsNull());
        $this->assertEquals('array', $returnType->getName());
    }

    /**
     * 測試策略類別的命名空間
     */
    public function test_strategy_namespace()
    {
        $reflection = new \ReflectionClass(ForceIntegerIds::class);
        $this->assertEquals('App\\Docs\\Strategies', $reflection->getNamespaceName());
    }

    /**
     * 測試策略類別的依賴
     */
    public function test_strategy_dependencies()
    {
        // 確保必要的類別存在
        $this->assertTrue(class_exists(ExtractedEndpointData::class));
        $this->assertTrue(trait_exists(ParamHelpers::class));
        $this->assertTrue(class_exists(\Knuckles\Scribe\Extracting\Strategies\Strategy::class));
    }

    /**
     * 測試策略類別的基本功能
     */
    public function test_strategy_basic_functionality()
    {
        $strategy = $this->createStrategy();
        
        // 確保策略可以處理不同的 endpoint data
        $endpointData1 = $this->createMock(ExtractedEndpointData::class);
        $endpointData2 = $this->createMock(ExtractedEndpointData::class);
        
        $result1 = $strategy($endpointData1, []);
        $result2 = $strategy($endpointData2, ['test' => 'value']);
        
        // 兩次調用都應該返回空數組
        $this->assertEquals([], $result1);
        $this->assertEquals([], $result2);
    }

    /**
     * 測試策略類別的 PHP 文檔
     */
    public function test_strategy_documentation()
    {
        $reflection = new \ReflectionClass(ForceIntegerIds::class);
        $method = $reflection->getMethod('__invoke');
        
        // 檢查方法是否有文檔註釋
        $docComment = $method->getDocComment();
        $this->assertNotFalse($docComment);
        
        // 檢查文檔註釋是否包含必要的信息
        $this->assertStringContainsString('@link', $docComment);
        $this->assertStringContainsString('@param', $docComment);
        $this->assertStringContainsString('@return', $docComment);
        $this->assertStringContainsString('ExtractedEndpointData', $docComment);
    }
}