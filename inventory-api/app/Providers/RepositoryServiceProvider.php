<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Repository 服務提供者
 * 
 * 負責綁定 Repository 介面與實作
 * 實現依賴注入容器的配置
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * 所有需要綁定的 Repository
     * 
     * @var array
     */
    protected array $repositories = [
        \App\Repositories\Contracts\InventoryRepositoryInterface::class => \App\Repositories\InventoryRepository::class,
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        // 綁定所有 Repository 介面到實作
        foreach ($this->repositories as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}