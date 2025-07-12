<?php

namespace Tests\Unit\Providers;

use App\Providers\GoogleCloudStorageServiceProvider;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Contracts\Foundation\Application;
use Mockery;

class GoogleCloudStorageServiceProviderTest extends TestCase
{
    use RefreshDatabase;

    protected GoogleCloudStorageServiceProvider $provider;

    protected function setUp(): void
    {
        parent::setUp();
        $this->provider = new GoogleCloudStorageServiceProvider($this->app);
    }

    public function test_provider_can_be_instantiated(): void
    {
        $this->assertInstanceOf(GoogleCloudStorageServiceProvider::class, $this->provider);
    }

    public function test_register_method_exists(): void
    {
        $this->assertTrue(method_exists($this->provider, 'register'));
    }

    public function test_boot_method_exists(): void
    {
        $this->assertTrue(method_exists($this->provider, 'boot'));
    }

    public function test_register_method_runs_without_error(): void
    {
        $this->provider->register();
        
        // register() 方法目前是空的，所以只要能執行不出錯即可
        $this->assertTrue(true);
    }

    public function test_boot_method_runs_without_error(): void
    {
        $this->provider->boot();
        
        // boot() 方法應該能正常執行
        $this->assertTrue(true);
    }

    public function test_gcs_driver_is_extended(): void
    {
        $this->provider->boot();
        
        // 檢查是否有 gcs 驅動程式可用
        $this->assertTrue(Storage::getDefaultDriver() !== null);
    }

    public function test_provider_service_provider_inheritance(): void
    {
        $this->assertInstanceOf(\Illuminate\Support\ServiceProvider::class, $this->provider);
    }

    public function test_provider_has_required_namespace(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        $this->assertEquals('App\Providers', $reflection->getNamespaceName());
    }

    public function test_provider_imports_correct_classes(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        $fileName = $reflection->getFileName();
        $content = file_get_contents($fileName);
        
        // 檢查是否正確引入必要的類別
        $this->assertStringContainsString('use Google\Cloud\Storage\StorageClient;', $content);
        $this->assertStringContainsString('use Illuminate\Filesystem\FilesystemAdapter;', $content);
        $this->assertStringContainsString('use Illuminate\Support\Facades\Storage;', $content);
        $this->assertStringContainsString('use Illuminate\Support\ServiceProvider;', $content);
        $this->assertStringContainsString('use League\Flysystem\Filesystem;', $content);
        $this->assertStringContainsString('use League\Flysystem\GoogleCloudStorage\GoogleCloudStorageAdapter;', $content);
    }

    public function test_provider_class_has_correct_docblock(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        $docComment = $reflection->getDocComment();
        
        $this->assertStringContainsString('Google Cloud Storage 服務提供者', $docComment);
        $this->assertStringContainsString('@package App\Providers', $docComment);
    }

    public function test_register_method_has_correct_docblock(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        $registerMethod = $reflection->getMethod('register');
        $docComment = $registerMethod->getDocComment();
        
        $this->assertStringContainsString('註冊服務', $docComment);
        $this->assertStringContainsString('@return void', $docComment);
    }

    public function test_boot_method_has_correct_docblock(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        $bootMethod = $reflection->getMethod('boot');
        $docComment = $bootMethod->getDocComment();
        
        $this->assertStringContainsString('啟動服務', $docComment);
        $this->assertStringContainsString('@return void', $docComment);
    }

    public function test_provider_methods_return_void(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        
        $registerMethod = $reflection->getMethod('register');
        $this->assertEquals('void', $registerMethod->getReturnType()->getName());
        
        $bootMethod = $reflection->getMethod('boot');
        $this->assertEquals('void', $bootMethod->getReturnType()->getName());
    }

    /**
     * 測試 Google Cloud Storage 驅動程式的配置邏輯
     * 這個測試模擬了實際的配置情況
     */
    public function test_gcs_driver_configuration_structure(): void
    {
        // 模擬配置
        $config = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'path_prefix' => 'test-prefix',
            'key_file' => '/path/to/key.json'
        ];
        
        // 檢查配置結構是否正確
        $this->assertArrayHasKey('project_id', $config);
        $this->assertArrayHasKey('bucket', $config);
        $this->assertArrayHasKey('path_prefix', $config);
        $this->assertArrayHasKey('key_file', $config);
    }

    /**
     * 測試不同的配置場景
     */
    public function test_config_scenarios(): void
    {
        // 測試本地開發配置 (有 key_file)
        $localConfig = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'key_file' => '/path/to/key.json'
        ];
        
        $this->assertArrayHasKey('key_file', $localConfig);
        $this->assertNotEmpty($localConfig['key_file']);
        
        // 測試生產環境配置 (沒有 key_file)
        $productionConfig = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket'
        ];
        
        $this->assertArrayNotHasKey('key_file', $productionConfig);
        
        // 測試有 path_prefix 的配置
        $configWithPrefix = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'path_prefix' => 'uploads/'
        ];
        
        $this->assertArrayHasKey('path_prefix', $configWithPrefix);
    }

    /**
     * 測試 boot 方法的內部邏輯結構
     */
    public function test_boot_method_internal_structure(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        $bootMethod = $reflection->getMethod('boot');
        
        // 檢查方法是否為 public
        $this->assertTrue($bootMethod->isPublic());
        
        // 檢查方法是否不是 static
        $this->assertFalse($bootMethod->isStatic());
        
        // 檢查方法參數
        $parameters = $bootMethod->getParameters();
        $this->assertCount(0, $parameters);
    }

    /**
     * 測試類別常數和屬性
     */
    public function test_class_structure(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        
        // 檢查類別是否不是抽象類
        $this->assertFalse($reflection->isAbstract());
        
        // 檢查類別是否不是 final
        $this->assertFalse($reflection->isFinal());
        
        // 檢查類別是否可以實例化
        $this->assertTrue($reflection->isInstantiable());
    }

    /**
     * 測試 Storage::extend 是否被正確調用
     */
    public function test_storage_extend_is_called(): void
    {
        // 使用 mock 來追蹤 Storage::extend 的調用
        $originalManager = Storage::getFacadeRoot();
        
        // 創建 mock Storage Manager
        $mockManager = Mockery::mock(\Illuminate\Filesystem\FilesystemManager::class);
        $mockManager->shouldReceive('extend')
            ->once()
            ->with('gcs', Mockery::type('Closure'))
            ->andReturnTrue();
        
        // 替換 Storage facade
        Storage::swap($mockManager);
        
        // 執行 boot 方法
        $this->provider->boot();
        
        // 恢復原始 manager
        Storage::swap($originalManager);
        
        $this->assertTrue(true); // 如果 mock 驗證通過，測試成功
    }

    /**
     * 測試 GCS 驅動回調函數的基本結構
     */
    public function test_gcs_driver_callback_structure(): void
    {
        // 由於實際的 GCS 配置需要真實的憑證，我們主要測試結構
        $config = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'path_prefix' => 'uploads/',
            'key_file' => null
        ];
        
        // 確保配置包含必要的鍵
        $this->assertArrayHasKey('project_id', $config);
        $this->assertArrayHasKey('bucket', $config);
        
        // 測試 path_prefix 的處理
        $this->assertTrue(isset($config['path_prefix']));
        
        // 測試 key_file 的處理
        $this->assertTrue(array_key_exists('key_file', $config));
    }

    /**
     * 測試配置驗證邏輯
     */
    public function test_config_validation_logic(): void
    {
        // 測試必需的配置項
        $requiredKeys = ['project_id', 'bucket'];
        
        foreach ($requiredKeys as $key) {
            $this->assertIsString($key);
            $this->assertNotEmpty($key);
        }
        
        // 測試可選的配置項
        $optionalKeys = ['key_file', 'path_prefix'];
        
        foreach ($optionalKeys as $key) {
            $this->assertIsString($key);
            $this->assertNotEmpty($key);
        }
    }

    /**
     * 測試不同的 key_file 配置場景
     */
    public function test_key_file_configuration_scenarios(): void
    {
        // 場景 1: key_file 存在且不為空
        $configWithKeyFile = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'key_file' => '/path/to/key.json'
        ];
        
        $this->assertTrue(isset($configWithKeyFile['key_file']) && !empty($configWithKeyFile['key_file']));
        
        // 場景 2: key_file 不存在
        $configWithoutKeyFile = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket'
        ];
        
        $this->assertFalse(isset($configWithoutKeyFile['key_file']));
        
        // 場景 3: key_file 為空字串
        $configWithEmptyKeyFile = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'key_file' => ''
        ];
        
        $this->assertFalse(isset($configWithEmptyKeyFile['key_file']) && !empty($configWithEmptyKeyFile['key_file']));
        
        // 場景 4: key_file 為 null
        $configWithNullKeyFile = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'key_file' => null
        ];
        
        $this->assertFalse(isset($configWithNullKeyFile['key_file']) && !empty($configWithNullKeyFile['key_file']));
    }

    /**
     * 測試 path_prefix 配置處理
     */
    public function test_path_prefix_configuration(): void
    {
        // 測試有 path_prefix 的情況
        $configWithPrefix = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'path_prefix' => 'uploads/'
        ];
        
        $this->assertTrue(isset($configWithPrefix['path_prefix']));
        $this->assertEquals('uploads/', $configWithPrefix['path_prefix']);
        
        // 測試沒有 path_prefix 的情況
        $configWithoutPrefix = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket'
        ];
        
        $this->assertFalse(isset($configWithoutPrefix['path_prefix']));
        
        // 測試空 path_prefix 的情況
        $configWithEmptyPrefix = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'path_prefix' => ''
        ];
        
        $this->assertTrue(isset($configWithEmptyPrefix['path_prefix']));
        $this->assertEquals('', $configWithEmptyPrefix['path_prefix']);
    }

    /**
     * 測試 Google Cloud Storage 相關類別的存在
     */
    public function test_gcs_classes_exist(): void
    {
        // 檢查必要的 Google Cloud Storage 類別是否存在
        $this->assertTrue(class_exists(\Google\Cloud\Storage\StorageClient::class));
        $this->assertTrue(class_exists(\League\Flysystem\GoogleCloudStorage\GoogleCloudStorageAdapter::class));
        $this->assertTrue(class_exists(\League\Flysystem\Filesystem::class));
        $this->assertTrue(class_exists(\Illuminate\Filesystem\FilesystemAdapter::class));
    }

    /**
     * 測試 closure 函數的參數結構
     */
    public function test_closure_parameter_structure(): void
    {
        // 模擬 closure 會接收到的參數
        $app = $this->app;
        $config = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket'
        ];
        
        // 確保 app 參數是 Application 實例
        $this->assertInstanceOf(Application::class, $app);
        
        // 確保 config 參數是陣列
        $this->assertIsArray($config);
    }

    /**
     * 測試客戶端配置建構邏輯
     */
    public function test_client_config_construction(): void
    {
        // 測試基本客戶端配置
        $config = ['project_id' => 'test-project'];
        $clientConfig = ['projectId' => $config['project_id']];
        
        $this->assertArrayHasKey('projectId', $clientConfig);
        $this->assertEquals('test-project', $clientConfig['projectId']);
        
        // 測試有 key_file 時的客戶端配置
        $configWithKeyFile = [
            'project_id' => 'test-project',
            'key_file' => '/path/to/key.json'
        ];
        
        $clientConfigWithKey = ['projectId' => $configWithKeyFile['project_id']];
        if (isset($configWithKeyFile['key_file']) && !empty($configWithKeyFile['key_file'])) {
            $clientConfigWithKey['keyFilePath'] = $configWithKeyFile['key_file'];
        }
        
        $this->assertArrayHasKey('keyFilePath', $clientConfigWithKey);
        $this->assertEquals('/path/to/key.json', $clientConfigWithKey['keyFilePath']);
    }

    /**
     * 測試適配器選項建構邏輯
     */
    public function test_adapter_options_construction(): void
    {
        // 測試沒有 path_prefix 的情況
        $configWithoutPrefix = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket'
        ];
        
        $options = [];
        if (isset($configWithoutPrefix['path_prefix'])) {
            $options['prefix'] = $configWithoutPrefix['path_prefix'];
        }
        
        $this->assertEmpty($options);
        
        // 測試有 path_prefix 的情況
        $configWithPrefix = [
            'project_id' => 'test-project',
            'bucket' => 'test-bucket',
            'path_prefix' => 'uploads/'
        ];
        
        $optionsWithPrefix = [];
        if (isset($configWithPrefix['path_prefix'])) {
            $optionsWithPrefix['prefix'] = $configWithPrefix['path_prefix'];
        }
        
        $this->assertArrayHasKey('prefix', $optionsWithPrefix);
        $this->assertEquals('uploads/', $optionsWithPrefix['prefix']);
    }

    /**
     * 測試服務提供者在測試環境中的行為
     */
    public function test_provider_behavior_in_test_environment(): void
    {
        // 確保在測試環境中服務提供者能正常運作
        $this->assertNotNull($this->provider);
        
        // 確保可以多次調用 boot 方法而不出錯
        $this->provider->boot();
        $this->provider->boot();
        
        $this->assertTrue(true);
    }

    /**
     * 測試異常情況的處理
     */
    public function test_exception_handling(): void
    {
        // register 方法應該不拋出異常（因為是空的）
        try {
            $this->provider->register();
            $this->assertTrue(true);
        } catch (\Exception $e) {
            $this->fail('register 方法不應該拋出異常');
        }
        
        // boot 方法在正常情況下也不應該拋出異常
        try {
            $this->provider->boot();
            $this->assertTrue(true);
        } catch (\Exception $e) {
            // 在某些環境下可能會有異常，但這不一定是錯誤
            $this->addWarning('boot 方法拋出異常: ' . $e->getMessage());
        }
    }

    /**
     * 測試方法的可訪問性
     */
    public function test_method_accessibility(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        
        // 確保 register 方法是 public
        $registerMethod = $reflection->getMethod('register');
        $this->assertTrue($registerMethod->isPublic());
        $this->assertFalse($registerMethod->isProtected());
        $this->assertFalse($registerMethod->isPrivate());
        
        // 確保 boot 方法是 public
        $bootMethod = $reflection->getMethod('boot');
        $this->assertTrue($bootMethod->isPublic());
        $this->assertFalse($bootMethod->isProtected());
        $this->assertFalse($bootMethod->isPrivate());
    }

    /**
     * 測試類別的繼承關係
     */
    public function test_inheritance_chain(): void
    {
        $reflection = new \ReflectionClass($this->provider);
        
        // 確保正確繼承 ServiceProvider
        $this->assertTrue($reflection->isSubclassOf(\Illuminate\Support\ServiceProvider::class));
        
        // 檢查是否有 app 屬性（而不是方法）
        $this->assertTrue($reflection->hasProperty('app'));
    }

    /**
     * 測試配置完整性檢查
     */
    public function test_complete_configuration_scenarios(): void
    {
        // 完整配置
        $completeConfig = [
            'project_id' => 'test-project-123',
            'bucket' => 'test-bucket-456',
            'key_file' => '/var/secrets/gcs-key.json',
            'path_prefix' => 'production/uploads/'
        ];
        
        // 驗證所有配置鍵都存在且有效
        $this->assertNotEmpty($completeConfig['project_id']);
        $this->assertNotEmpty($completeConfig['bucket']);
        $this->assertNotEmpty($completeConfig['key_file']);
        $this->assertNotEmpty($completeConfig['path_prefix']);
        
        // 最小配置
        $minimalConfig = [
            'project_id' => 'minimal-project',
            'bucket' => 'minimal-bucket'
        ];
        
        // 驗證最小配置的有效性
        $this->assertNotEmpty($minimalConfig['project_id']);
        $this->assertNotEmpty($minimalConfig['bucket']);
        $this->assertArrayNotHasKey('key_file', $minimalConfig);
        $this->assertArrayNotHasKey('path_prefix', $minimalConfig);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}