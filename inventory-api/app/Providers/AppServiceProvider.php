<?php

namespace App\Providers;

use Dedoc\Scramble\Scramble;
use Illuminate\Routing\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

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
        // 配置 Scramble PRO 路由過濾器
        // 暫時只生成分類模組文檔，確保核心功能正常
        Scramble::configure()
            ->routes(function (Route $route) {
                // 只包含分類相關的 API 路由
                return Str::startsWith($route->uri, 'api/categories');
            });
    }
}
