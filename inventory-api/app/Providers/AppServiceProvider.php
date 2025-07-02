<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Knuckles\Scribe\Scribe;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 🧪 全局 URL 標準化 Hook - 實驗性解決方案
        if (class_exists(Scribe::class)) {
            Scribe::normalizeEndpointUrlUsing(
                function (string $url, Route $route, \ReflectionFunctionAbstract $method,
                         ?\ReflectionClass $controller, callable $default) {
                    
                    // 📊 記錄標準化過程（開發階段）
                    if (config('app.debug')) {
                        Log::debug('🔄 [Scribe] URL 標準化嘗試', [
                            'original_url' => $url,
                            'laravel_uri' => $route->uri(),
                            'route_name' => $route->getName(),
                            'action' => 'testing_laravel_uri_override'
                        ]);
                    }
                    
                    // 🧪 核心假設：使用Laravel原始URI阻止Scribe自動標準化
                    // 預期效果：保持 {order_item} 而不是 {order_item_id}
                    return $route->uri();
                }
            );
            
            Log::info('🧪 [Scribe] URL標準化Hook已註冊 - 實驗模式');
        }
    }
}
