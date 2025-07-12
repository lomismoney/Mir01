<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PurchaseService;
use App\Data\PurchaseData;
use App\Data\PurchaseItemData;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Store;
use App\Models\User;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\LaravelData\DataCollection;

/**
 * PurchaseService 額外測試
 * 補充測試 PurchaseService 中未被覆蓋的方法和邏輯
 */
class PurchaseServiceAdditionalTest extends TestCase
{
    use RefreshDatabase;

    private PurchaseService $purchaseService;
    private User $user;
    private Store $store;
    private ProductVariant $productVariant1;
    private ProductVariant $productVariant2;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Auth::login($this->user);
        
        // 創建測試門市
        $this->store = Store::factory()->create();
        
        // 創建測試商品和變體
        $category = Category::factory()->create();
        $product1 = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant1 = ProductVariant::factory()->create([
            'product_id' => $product1->id,
            'sku' => 'TEST-SKU-001',
            'cost_price' => 50.00,
            'average_cost' => 45.00,
            'total_purchased_quantity' => 100,
            'total_cost_amount' => 4500.00
        ]);
        
        $product2 = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant2 = ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sku' => 'TEST-SKU-002',
            'cost_price' => 100.00,
            'average_cost' => 0,
            'total_purchased_quantity' => 0,
            'total_cost_amount' => 0
        ]);
        
        $this->purchaseService = new PurchaseService();
    }

    /**
     * 測試創建進貨單
     */
    public function test_create_purchase_successfully()
    {
        $purchaseData = PurchaseData::from([
            'store_id' => $this->store->id,
            'shipping_cost' => 100,
            'purchased_at' => Carbon::create(2025, 7, 9),
            'items' => [
                [
                    'product_variant_id' => $this->productVariant1->id,
                    'quantity' => 10,
                    'cost_price' => 50
                ],
                [
                    'product_variant_id' => $this->productVariant2->id,
                    'quantity' => 5,
                    'cost_price' => 100
                ]
            ]
        ]);

        $purchase = $this->purchaseService->createPurchase($purchaseData);

        // 驗證進貨單主記錄
        $this->assertInstanceOf(Purchase::class, $purchase);
        $this->assertEquals($this->store->id, $purchase->store_id);
        $this->assertEquals($this->user->id, $purchase->user_id);
        $this->assertEquals('PO-20250709-001', $purchase->order_number);
        $this->assertEquals(110000, $purchase->getRawOriginal('total_amount')); // (10*50 + 5*100 + 100) * 100
        $this->assertEquals(10000, $purchase->getRawOriginal('shipping_cost')); // 100 * 100
        $this->assertEquals('pending', $purchase->status);
        
        // 驗證進貨項目
        $this->assertCount(2, $purchase->items);
        
        $item1 = $purchase->items->where('product_variant_id', $this->productVariant1->id)->first();
        $this->assertEquals(10, $item1->quantity);
        $this->assertEquals(5000, $item1->getRawOriginal('cost_price')); // 50 * 100
        
        $item2 = $purchase->items->where('product_variant_id', $this->productVariant2->id)->first();
        $this->assertEquals(5, $item2->quantity);
        $this->assertEquals(10000, $item2->getRawOriginal('cost_price')); // 100 * 100
    }

    /**
     * 測試創建進貨單並自動分配運費
     */
    public function test_create_purchase_with_shipping_cost_allocation()
    {
        $purchaseData = PurchaseData::from([
            'store_id' => $this->store->id,
            'shipping_cost' => 200, // 200元運費
            'purchased_at' => Carbon::now(),
            'items' =>  [
                [
                    'product_variant_id' => $this->productVariant1->id,
                    'quantity' => 20,
                    'cost_price' => 50
                ],
                [
                    'product_variant_id' => $this->productVariant2->id,
                    'quantity' => 30,
                    'cost_price' => 100
                ]
            ]
        ]);

        $purchase = $this->purchaseService->createPurchase($purchaseData);

        // 驗證運費分配
        // 總數量: 20 + 30 = 50
        // 項目1運費: 200 * (20/50) = 80
        // 項目2運費: 200 * (30/50) = 120
        
        $item1 = $purchase->items->where('product_variant_id', $this->productVariant1->id)->first();
        $this->assertEquals(8000, $item1->getRawOriginal('allocated_shipping_cost')); // 80 * 100
        
        $item2 = $purchase->items->where('product_variant_id', $this->productVariant2->id)->first();
        $this->assertEquals(12000, $item2->getRawOriginal('allocated_shipping_cost')); // 120 * 100
    }

    /**
     * 測試更新進貨單
     */
    public function test_update_purchase_successfully()
    {
        // 先創建一個進貨單
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'status' => 'pending',
            'total_amount' => 50000, // 500元
            'shipping_cost' => 5000   // 50元
        ]);
        
        // 創建原始項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 5,
            'cost_price' => 5000  // 50元
        ]);
        
        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 2,
            'cost_price' => 10000  // 100元
        ]);
        
        // 準備更新資料
        $updateData = PurchaseData::from([
            'store_id' => $this->store->id,
            'order_number' => $purchase->order_number,  // 保持原有的訂單編號
            'shipping_cost' => 150,
            'items' =>  [
                [
                    'id' => $item1->id,
                    'product_variant_id' => $this->productVariant1->id,
                    'quantity' => 8,  // 從 5 增加到 8
                    'cost_price' => 60  // 從 50 增加到 60
                ],
                // item2 被移除
                // 新增一個項目
                [
                    'product_variant_id' => $this->productVariant2->id,
                    'quantity' => 10,
                    'cost_price' => 120
                ]
            ]
        ]);
        
        $updatedPurchase = $this->purchaseService->updatePurchase($purchase, $updateData);
        
        // 驗證更新結果
        $this->assertEquals(183000, $updatedPurchase->getRawOriginal('total_amount')); // (8*60 + 10*120 + 150) * 100
        $this->assertEquals(15000, $updatedPurchase->getRawOriginal('shipping_cost')); // 150 * 100
        
        // 驗證項目
        $this->assertCount(2, $updatedPurchase->items);
        
        // 驗證 item2 已被刪除
        $this->assertDatabaseMissing('purchase_items', ['id' => $item2->id]);
    }

    /**
     * 測試更新進貨單狀態 - 確認進貨
     */
    public function test_update_purchase_status_to_confirmed()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);
        
        $updatedPurchase = $this->purchaseService->updatePurchaseStatus(
            $purchase,
            'confirmed',
            $this->user->id,
            '確認訂單'
        );
        
        $this->assertEquals('confirmed', $updatedPurchase->status);
        
        // 驗證日誌記錄
        // 由於 Log::info 被調用，這裡只能通過功能測試來驗證
    }

    /**
     * 測試更新進貨單狀態 - 完成入庫
     */
    public function test_update_purchase_status_to_completed()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'received'
        ]);
        
        // 創建進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 10,
            'cost_price' => 5000,
            'allocated_shipping_cost' => 1000
        ]);
        
        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 5,
            'cost_price' => 10000,
            'allocated_shipping_cost' => 2000
        ]);
        
        // 創建庫存記錄
        Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 50
        ]);
        
        $updatedPurchase = $this->purchaseService->updatePurchaseStatus(
            $purchase,
            'completed',
            $this->user->id,
            '完成入庫'
        );
        
        $this->assertEquals('completed', $updatedPurchase->status);
        
        // 驗證庫存更新
        $inventory1 = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant1->id)
            ->first();
        $this->assertEquals(60, $inventory1->quantity); // 50 + 10
        
        $inventory2 = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant2->id)
            ->first();
        $this->assertEquals(5, $inventory2->quantity); // 0 + 5
        
        // 驗證商品變體的平均成本更新
        $this->productVariant1->refresh();
        // 原始：100個，總成本4500
        // 新增：10個，單價成本50，運費攤銷10元（總運費攤銷1000分=10元）
        // 總計：110個，總成本4500+600=5100
        // 平均：5100/110=46.36
        $this->assertEquals(110, $this->productVariant1->total_purchased_quantity);
        $this->assertEquals(5100, $this->productVariant1->total_cost_amount);
        $this->assertEquals(46.36, round($this->productVariant1->average_cost, 2));
        
        $this->productVariant2->refresh();
        // 原始：0個，總成本0
        // 新增：5個，單價成本100，運費攤銷20元（總運費攤銷2000分=20元）
        // 總計：5個，總成本5*(100+20)=600
        // 平均：600/5=120
        $this->assertEquals(5, $this->productVariant2->total_purchased_quantity);
        $this->assertEquals(600, $this->productVariant2->total_cost_amount);
        $this->assertEquals(120, $this->productVariant2->average_cost);
    }

    /**
     * 測試更新進貨單狀態 - 取消
     */
    public function test_update_purchase_status_to_cancelled()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);
        
        $updatedPurchase = $this->purchaseService->updatePurchaseStatus(
            $purchase,
            'cancelled',
            $this->user->id,
            '供應商無法供貨'
        );
        
        $this->assertEquals('cancelled', $updatedPurchase->status);
    }

    /**
     * 測試無效的狀態轉換
     */
    public function test_invalid_status_transition()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'completed'
        ]);
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('無法從');
        
        $this->purchaseService->updatePurchaseStatus(
            $purchase,
            'pending', // 不能從 completed 轉回 pending
            $this->user->id
        );
    }

    /**
     * 測試已收貨但無庫存記錄時的處理
     */
    public function test_update_to_completed_creates_inventory_if_not_exists()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'received'
        ]);
        
        $item = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 20,
            'cost_price' => 6000,
            'allocated_shipping_cost' => 0
        ]);
        
        // 確保沒有庫存記錄
        $this->assertDatabaseMissing('inventories', [
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant1->id
        ]);
        
        $updatedPurchase = $this->purchaseService->updatePurchaseStatus(
            $purchase,
            'completed',
            $this->user->id
        );
        
        // 驗證創建了新的庫存記錄
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant1->id)
            ->first();
        
        $this->assertNotNull($inventory);
        $this->assertEquals(20, $inventory->quantity);
    }

    /**
     * 測試創建進貨單時日期格式化
     */
    public function test_create_purchase_with_custom_date()
    {
        $purchaseData = PurchaseData::from([
            'store_id' => $this->store->id,
            'shipping_cost' => 0,
            'purchased_at' => Carbon::create(2025, 1, 15),
            'items' =>  [
                [
                    'product_variant_id' => $this->productVariant1->id,
                    'quantity' => 1,
                    'cost_price' => 100
                ]
            ]
        ]);

        $purchase = $this->purchaseService->createPurchase($purchaseData);

        // 驗證單號格式
        $this->assertStringStartsWith('PO-20250115-', $purchase->order_number);
    }

    /**
     * 測試無運費的進貨單
     */
    public function test_create_purchase_without_shipping_cost()
    {
        $purchaseData = PurchaseData::from([
            'store_id' => $this->store->id,
            'shipping_cost' => 0,
            'purchased_at' => Carbon::now(),
            'items' =>  [
                [
                    'product_variant_id' => $this->productVariant1->id,
                    'quantity' => 10,
                    'cost_price' => 50
                ]
            ]
        ]);

        $purchase = $this->purchaseService->createPurchase($purchaseData);

        $item = $purchase->items->first();
        $this->assertEquals(0, $item->allocated_shipping_cost);
        $this->assertEquals(50000, $purchase->getRawOriginal('total_amount')); // 10 * 50 * 100
    }
}