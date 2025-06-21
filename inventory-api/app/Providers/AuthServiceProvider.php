<?php

namespace App\Providers;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\InventoryTransfer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Store;
use App\Models\User;
use App\Policies\AttributePolicy;
use App\Policies\AttributeValuePolicy;
use App\Policies\CategoryPolicy;
use App\Policies\InventoryTransferPolicy;
use App\Policies\OrderPolicy;
use App\Policies\ProductPolicy;
use App\Policies\PurchasePolicy;
use App\Policies\StorePolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

/**
 * 認證服務提供者
 * 
 * 負責註冊應用程式的權限策略對應關係，
 * 告訴 Laravel 框架在進行權限檢查時使用哪個策略類別
 */
class AuthServiceProvider extends ServiceProvider
{
    /**
     * 模型與策略的對應關係
     * 
     * 定義哪個模型應該使用哪個策略類別進行權限檢查
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Product::class => ProductPolicy::class,
        User::class => UserPolicy::class,
        Category::class => CategoryPolicy::class,
        Attribute::class => AttributePolicy::class,
        AttributeValue::class => AttributeValuePolicy::class,
        InventoryTransfer::class => InventoryTransferPolicy::class,
        Store::class => StorePolicy::class,
        Purchase::class => PurchasePolicy::class,
        Order::class => OrderPolicy::class,
    ];

    /**
     * 註冊應用程式服務
     * 
     * @return void
     */
    public function register(): void
    {
        //
    }

    /**
     * 啟動應用程式服務
     * 
     * 註冊策略並進行其他認證相關的初始化
     * 
     * @return void
     */
    public function boot(): void
    {
        // 註冊策略對應關係
        $this->registerPolicies();
    }
}
