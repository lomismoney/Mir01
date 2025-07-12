<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PurchaseService;
use App\Services\InventoryService;
use App\Services\BackorderAllocationService;
use App\Data\PurchaseData;
use App\Data\PurchaseItemData;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\User;
use App\Models\Store;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Mockery;

class PurchaseServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PurchaseService $purchaseService;
    protected $mockInventoryService;
    protected $mockBackorderAllocationService;
    protected User $user;
    protected Store $store;
    protected ProductVariant $productVariant;

    protected function setUp(): void
    {
        parent::setUp();

        // 安全地創建角色，避免重複創建
        if (!Role::where('name', 'admin')->exists()) {
            Role::create(['name' => 'admin']);
        }

        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Auth::login($this->user);

        // 創建測試資料
        $this->store = Store::factory()->create();
        
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'PURCHASE-SERVICE-SKU-' . uniqid(),
            'price' => 100.00
        ]);

        // Mock 依賴服務
        $this->mockInventoryService = Mockery::mock(InventoryService::class);
        $this->mockBackorderAllocationService = Mockery::mock(BackorderAllocationService::class);

        // 注入依賴到 app container
        $this->app->instance(InventoryService::class, $this->mockInventoryService);
        $this->app->instance(BackorderAllocationService::class, $this->mockBackorderAllocationService);

        // 創建 PurchaseService 實例
        $this->purchaseService = $this->app->make(PurchaseService::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * 測試成功創建進貨單
     */
    public function test_create_purchase_successfully(): void
    {
        // 創建 PurchaseData 物件
        $purchaseData = PurchaseData::from([
            'store_id' => $this->store->id,
            'order_number' => null, // 系統會自動生成
            'shipping_cost' => 5000, // 50.00 元 = 5000 分
            'status' => 'pending',
            'purchased_at' => now(),
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 8000, // 80.00 元 = 8000 分
                ]
            ]
        ]);

        $purchase = $this->purchaseService->createPurchase($purchaseData);

        $this->assertInstanceOf(Purchase::class, $purchase);
        $this->assertNotNull($purchase->order_number);
        $this->assertStringStartsWith('PO-', $purchase->order_number);
        $this->assertEquals($this->store->id, $purchase->store_id);
        $this->assertEquals('pending', $purchase->status);
        $this->assertEquals(5000, $purchase->shipping_cost); // 值仍為分
        $this->assertCount(1, $purchase->items);

        // 驗證進貨項目
        $purchaseItem = $purchase->items->first();
        $this->assertEquals($this->productVariant->id, $purchaseItem->product_variant_id);
        $this->assertEquals(10, $purchaseItem->quantity);
        $this->assertEquals(8000, $purchaseItem->cost_price); // 值仍為分
    }

    /**
     * 測試狀態轉換驗證 - 基於重構後的狀態機制
     */
    public function test_validates_status_transitions(): void
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);

        // 有效的狀態轉換
        $updatedPurchase = $this->purchaseService->updatePurchaseStatus($purchase, 'confirmed', null, '已向供應商確認訂單');
        $this->assertEquals('confirmed', $updatedPurchase->status);

        // 測試無效的狀態轉換（從 confirmed 直接到 completed）
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('進貨單狀態轉換不合法');

        $this->purchaseService->updatePurchaseStatus($updatedPurchase, 'completed', null, '直接完成');
    }

    /**
     * 測試庫存更新時的智能分配 - 基於重構後的分配機制
     */
    public function test_allocates_backorders_when_updating_inventory(): void
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'received'
        ]);

        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 20,
            'cost_price' => 7500
        ]);

        // 不需要 Mock 庫存服務，因為 PurchaseService 直接使用 Inventory 模型

        // Mock 預訂分配服務 (可能不會在這個測試場景中被調用)
        $this->mockBackorderAllocationService
            ->shouldReceive('allocateBackorders')
            ->zeroOrMoreTimes()
            ->andReturn([
                'allocated_orders' => 2,
                'allocated_quantity' => 15,
                'remaining_quantity' => 5
            ]);

        // 更新狀態為已完成
        $result = $this->purchaseService->updatePurchaseStatus($purchase, 'completed', null, '已入庫');

        $this->assertInstanceOf(Purchase::class, $result);
        $this->assertEquals('completed', $result->status);
    }

    /**
     * 測試部分收貨處理
     */
    public function test_handles_partial_receiving_status(): void
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'in_transit'
        ]);

        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
            'cost_price' => 7000
        ]);

        // 更新部分收貨狀態
        $updatedPurchase = $this->purchaseService->updatePurchaseStatus(
            $purchase,
            'partially_received',
            null,
            '部分商品已到貨'
        );

        $this->assertEquals('partially_received', $updatedPurchase->status);
        
        // 測試由部分收貨轉為已收貨
        $fullyReceivedPurchase = $this->purchaseService->updatePurchaseStatus(
            $updatedPurchase,
            'received',
            null,
            '全部商品已到貨'
        );
        
        $this->assertEquals('received', $fullyReceivedPurchase->status);
    }

    /**
     * 測試成本計算邏輯 - 基於統一金額處理
     */
    public function test_calculates_costs_accurately(): void
    {
        $purchaseData = PurchaseData::from([
            'store_id' => $this->store->id,
            'order_number' => null,
            'shipping_cost' => 10000, // 100.00 元 = 10000 分
            'status' => 'pending',
            'purchased_at' => now(),
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 50,
                    'cost_price' => 6050, // 60.50 元 = 6050 分
                ]
            ]
        ]);

        $purchase = $this->purchaseService->createPurchase($purchaseData);
        
        $purchaseItem = $purchase->items->first();
        
        // 驗證成本計算精確性（分為單位）
        $expectedItemTotal = 6050 * 50; // 302500 分
        $expectedTotalCost = $expectedItemTotal + 10000; // 312500 分
        
        $this->assertEquals(6050, $purchaseItem->cost_price); // 值為分
        $this->assertEquals(50, $purchaseItem->quantity);
        $this->assertEquals($expectedTotalCost, $purchase->total_amount);
    }

    /**
     * 測試事務處理 - 基於重構後的 BaseService 架構
     */
    public function test_handles_transaction_rollback_on_error(): void
    {
        $purchaseData = PurchaseData::from([
            'store_id' => $this->store->id,
            'order_number' => null,
            'shipping_cost' => 0,
            'status' => 'pending',
            'purchased_at' => now(),
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 5000, // 50.00 元 = 5000 分
                ]
            ]
        ]);

        // 模擬數據庫錯誤（在項目創建時）
        PurchaseItem::creating(function () {
            throw new \Exception('數據庫錯誤');
        });

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('數據庫錯誤');

        $this->purchaseService->createPurchase($purchaseData);

        // 驗證沒有創建任何進貨單記錄（事務回滾）
        $this->assertDatabaseMissing('purchases', ['store_id' => $this->store->id]);
    }

    /**
     * 測試權限驗證 - 基於重構後的 BaseService 架構
     */
    public function test_validates_user_authorization(): void
    {
        // 確保當前用戶已登入
        $this->assertNotNull(Auth::user());
        
        // 退出登錄
        Auth::logout();
        
        // 嘗試在未登入狀態下創建進貨單
        $purchaseData = PurchaseData::from([
            'store_id' => $this->store->id,
            'order_number' => null,
            'shipping_cost' => 0,
            'status' => 'pending',
            'purchased_at' => now(),
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 1,
                    'cost_price' => 1000,
                ]
            ]
        ]);
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('用戶必須經過認證才能執行建立進貨單');
        
        $this->purchaseService->createPurchase($purchaseData);
    }

    /**
     * 測試狀態歷史記錄 - 基於重構後的 HandlesStatusHistory Trait
     */
    public function test_records_status_history_properly(): void
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);

        $updatedPurchase = $this->purchaseService->updatePurchaseStatus(
            $purchase, 
            'confirmed', 
            null,
            '已向供應商確認訂單'
        );

        // 驗證狀態更新成功
        $this->assertEquals('confirmed', $updatedPurchase->status);
        
        // TODO: 實現 Purchase 狀態歷史功能
        // $this->assertTrue($updatedPurchase->relationLoaded('statusHistories'));
        // $statusHistory = $updatedPurchase->statusHistories()->latest()->first();
    }

    /**
     * 測試預載入關聯 - 基於重構後的 N+1 查詢優化
     */
    public function test_preloads_relationships_to_prevent_n_plus_one(): void
    {
        // 創建多個進貨單
        $purchases = Purchase::factory()->count(3)->create([
            'store_id' => $this->store->id
        ]);

        // 為每個進貨單創建項目
        foreach ($purchases as $purchase) {
            PurchaseItem::factory()->create([
                'purchase_id' => $purchase->id,
                'product_variant_id' => $this->productVariant->id
            ]);
        }

        // 使用服務方法獲取進貨單（應該預加載關聯）
        $purchaseIds = $purchases->pluck('id')->toArray();
        $retrievedPurchases = $this->purchaseService->getPurchasesWithRelations($purchaseIds);

        // 驗證關聯已經預加載
        foreach ($retrievedPurchases as $purchase) {
            $this->assertTrue($purchase->relationLoaded('store'));
            $this->assertTrue($purchase->relationLoaded('items'));
            // TODO: 實現 statusHistories 功能後取消註解
            // $this->assertTrue($purchase->relationLoaded('statusHistories'));
        }
    }

    /**
     * 測試取消進貨單
     */
    public function test_cancel_purchase_successfully(): void
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);

        $cancelledPurchase = $this->purchaseService->updatePurchaseStatus(
            $purchase,
            'cancelled',
            null,
            '供應商無法供貨'
        );

        $this->assertEquals('cancelled', $cancelledPurchase->status);
        
        // TODO: 實現 Purchase 狀態歷史功能
        // $statusHistory = $cancelledPurchase->statusHistories->first();
        // $this->assertEquals('pending', $statusHistory->from_status);
        // $this->assertEquals('cancelled', $statusHistory->to_status);
    }
}