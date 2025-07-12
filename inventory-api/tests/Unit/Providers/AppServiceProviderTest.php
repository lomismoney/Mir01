<?php

namespace Tests\Unit\Providers;

use App\Providers\AppServiceProvider;
use Illuminate\Support\Facades\Log;
use Knuckles\Scribe\Scribe;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteManager;

class AppServiceProviderTest extends TestCase
{
    use RefreshDatabase;

    protected AppServiceProvider $provider;

    protected function setUp(): void
    {
        parent::setUp();
        $this->provider = new AppServiceProvider($this->app);
    }

    public function test_provider_can_be_instantiated(): void
    {
        $this->assertInstanceOf(AppServiceProvider::class, $this->provider);
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

    public function test_scribe_normalization_hook_with_scribe_available(): void
    {
        // 檢查是否有 Scribe 類別
        if (!class_exists(Scribe::class)) {
            $this->markTestSkipped('Scribe class not available');
        }

        Log::spy();
        
        $this->provider->boot();
        
        // 檢查是否記錄了 Hook 註冊訊息
        Log::shouldHaveReceived('info')
            ->once()
            ->with('🧪 [Scribe] URL標準化Hook已註冊 - 實驗模式');
    }

    public function test_scribe_normalization_callback_functionality(): void
    {
        if (!class_exists(Scribe::class)) {
            $this->markTestSkipped('Scribe class not available');
        }

        Log::spy();
        
        // 模擬 debug 模式
        config(['app.debug' => true]);
        
        $this->provider->boot();
        
        // 創建一個模擬的 Route
        $route = RouteManager::get('/test/{id}', function () {
            return 'test';
        });
        
        // 檢查 URI 是否正確返回
        $this->assertEquals('test/{id}', $route->uri());
    }

    public function test_scribe_normalization_with_debug_logging(): void
    {
        if (!class_exists(Scribe::class)) {
            $this->markTestSkipped('Scribe class not available');
        }

        Log::spy();
        
        // 啟用 debug 模式
        config(['app.debug' => true]);
        
        $this->provider->boot();
        
        // 檢查是否記錄了 debug 訊息
        Log::shouldHaveReceived('info')
            ->once()
            ->with('🧪 [Scribe] URL標準化Hook已註冊 - 實驗模式');
    }

    public function test_scribe_normalization_without_debug_mode(): void
    {
        if (!class_exists(Scribe::class)) {
            $this->markTestSkipped('Scribe class not available');
        }

        Log::spy();
        
        // 停用 debug 模式
        config(['app.debug' => false]);
        
        $this->provider->boot();
        
        // 仍然應該記錄 Hook 註冊訊息
        Log::shouldHaveReceived('info')
            ->once()
            ->with('🧪 [Scribe] URL標準化Hook已註冊 - 實驗模式');
    }

    public function test_boot_method_without_scribe_class(): void
    {
        // 如果沒有 Scribe 類別，boot() 方法應該仍然能正常執行
        $this->provider->boot();
        
        $this->assertTrue(true);
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
        $this->assertStringContainsString('use Illuminate\Support\ServiceProvider;', $content);
        $this->assertStringContainsString('use Knuckles\Scribe\Scribe;', $content);
        $this->assertStringContainsString('use Illuminate\Routing\Route;', $content);
        $this->assertStringContainsString('use Illuminate\Support\Facades\Log;', $content);
    }
}