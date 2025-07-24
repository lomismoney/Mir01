<?php

namespace Tests\Feature\Api;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Store;
use App\Models\User;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PurchaseShippingCostTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected Store $store;
    protected ProductVariant $productVariant1;
    protected ProductVariant $productVariant2;
    protected Purchase $purchase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        
        // 創建門市
        $this->store = Store::factory()->create();
        
        // 創建分類
        $category = Category::factory()->create();
        
        // 創建商品和商品變體
        $product1 = Product::factory()->create(['category_id' => $category->id]);
        $product2 = Product::factory()->create(['category_id' => $category->id]);
        
        $this->productVariant1 = ProductVariant::factory()->create([
            'product_id' => $product1->id,
            'sku' => 'TEST-001',
            'cost_price' => 10000, // 100元
        ]);
        
        $this->productVariant2 = ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sku' => 'TEST-002',
            'cost_price' => 20000, // 200元
        ]);
    }

    /**
     * 測試運費更新基本功能
     */
    public function test_can_update_shipping_cost()
    {
        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 50000, // 500元 (50000分)
            'total_amount' => 350000, // 3500元 (350000分)
            'status' => 'pending',
        ]);

        // 創建進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 10,
            'cost_price' => 10000, // 100元 (10000分)
            'allocated_shipping_cost' => 16667, // 166.67元 (16667分，原運費按比例分配)
        ]);

        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 10,
            'cost_price' => 20000, // 200元 (20000分)
            'allocated_shipping_cost' => 33333, // 333.33元 (33333分，原運費按比例分配)
        ]);

        // 測試更新運費
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 1000, // 更新為1000元 (API 以元為單位)
            ]);

        $response->assertStatus(200);
        
        // 驗證回應結構
        $response->assertJsonStructure([
            'data' => [
                'id',
                'order_number',
                'shipping_cost',
                'total_amount',
                'items' => [
                    '*' => [
                        'id',
                        'allocated_shipping_cost',
                    ]
                ]
            ]
        ]);

        // 重新載入資料並驗證
        $this->purchase->refresh();
        $this->assertEquals(100000, $this->purchase->shipping_cost); // 1000元 (100000分)
        $this->assertEquals(400000, $this->purchase->total_amount); // 3000元商品 + 1000元運費 (400000分)
        
        // 驗證運費重新分配
        $item1->refresh();
        $item2->refresh();
        
        // 驗證運費分配 (按數量比例：10:10 = 1:1)
        $this->assertEquals(50000, $item1->allocated_shipping_cost); // 500元 (50000分)
        $this->assertEquals(50000, $item2->allocated_shipping_cost); // 500元 (50000分)
        
        // 驗證總運費分配正確
        $this->assertEquals(
            $this->purchase->shipping_cost,
            $item1->allocated_shipping_cost + $item2->allocated_shipping_cost
        );
    }

    /**
     * 測試運費更新時按不同數量比例分配
     */
    public function test_shipping_cost_allocation_by_quantity_ratio()
    {
        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 30000, // 300元 (30000分)
            'total_amount' => 330000, // 3300元 (330000分)
            'status' => 'pending',
        ]);

        // 創建不同數量的進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 5, // 5個
            'cost_price' => 10000, // 100元 (10000分)
            'allocated_shipping_cost' => 10000, // 原分配 (10000分)
        ]);

        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 25, // 25個
            'cost_price' => 20000, // 200元 (20000分)
            'allocated_shipping_cost' => 20000, // 原分配 (20000分)
        ]);

        // 更新運費為900元
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 900,
            ]);

        $response->assertStatus(200);
        
        // 重新載入並驗證
        $item1->refresh();
        $item2->refresh();
        
        // 總數量：5 + 25 = 30
        // 運費分配比例：5:25 = 1:5
        // item1: 900 * (5/30) = 150元 (15000分)
        // item2: 900 * (25/30) = 750元 (75000分)
        $this->assertEquals(15000, $item1->allocated_shipping_cost); // 150元 (15000分)
        $this->assertEquals(75000, $item2->allocated_shipping_cost); // 750元 (75000分)
        
        // 驗證總運費分配正確
        $this->assertEquals(
            90000, // 900元 (90000分)
            $item1->allocated_shipping_cost + $item2->allocated_shipping_cost
        );
    }

    /**
     * 測試運費更新為零
     */
    public function test_can_update_shipping_cost_to_zero()
    {
        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 50000, // 500元 (50000分)
            'total_amount' => 350000, // 3500元 (350000分)
            'status' => 'pending',
        ]);

        // 創建進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 10,
            'cost_price' => 10000, // 100元 (10000分)
            'allocated_shipping_cost' => 25000, // 250元 (25000分)
        ]);

        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 10,
            'cost_price' => 20000, // 200元 (20000分)
            'allocated_shipping_cost' => 25000, // 250元 (25000分)
        ]);

        // 更新運費為0
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 0,
            ]);

        $response->assertStatus(200);
        
        // 重新載入並驗證
        $this->purchase->refresh();
        $item1->refresh();
        $item2->refresh();
        
        $this->assertEquals(0, $this->purchase->shipping_cost);
        $this->assertEquals(300000, $this->purchase->total_amount); // 只有商品成本 = 3000元 (300000分)
        $this->assertEquals(0, $item1->allocated_shipping_cost);
        $this->assertEquals(0, $item2->allocated_shipping_cost);
    }

    /**
     * 測試三個項目的運費分配 (確保最後一項目處理四捨五入誤差)
     */
    public function test_shipping_cost_allocation_with_rounding_adjustment()
    {
        // 創建第三個商品變體
        $product3 = Product::factory()->create(['category_id' => Category::first()->id]);
        $productVariant3 = ProductVariant::factory()->create([
            'product_id' => $product3->id,
            'sku' => 'TEST-003',
            'cost_price' => 1500000, // 15000元 (1500000分)
        ]);

        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 10000, // 100元 (10000分)
            'total_amount' => 100000, // 1000元 (100000分)
            'status' => 'pending',
        ]);

        // 創建三個進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 1,
            'cost_price' => 10000, // 100元 (10000分)
            'allocated_shipping_cost' => 3333, // 33.33元 (3333分)
        ]);

        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 1,
            'cost_price' => 20000, // 200元 (20000分)
            'allocated_shipping_cost' => 3333, // 33.33元 (3333分)
        ]);

        $item3 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $productVariant3->id,
            'quantity' => 1,
            'cost_price' => 15000, // 150元 (15000分)
            'allocated_shipping_cost' => 3334, // 33.34元 (3334分)
        ]);

        // 更新運費為1000元 (應該會有四捨五入調整)
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 1000,
            ]);

        $response->assertStatus(200);
        
        // 重新載入並驗證
        $item1->refresh();
        $item2->refresh();
        $item3->refresh();
        
        // 驗證每個項目的運費分配
        // 總數量：3, 每個項目數量：1
        // 理論分配：1000元 / 3 = 333.33...
        // 實際分配（以分為單位）：前兩個 33333分，最後一個調整為 33334分
        $this->assertEquals(33333, $item1->allocated_shipping_cost); // 333.33元 (33333分)
        $this->assertEquals(33333, $item2->allocated_shipping_cost); // 333.33元 (33333分)
        $this->assertEquals(33334, $item3->allocated_shipping_cost); // 333.34元 (33334分，最後一個調整誤差)
        
        // 驗證總運費分配正確
        $this->assertEquals(
            100000, // 1000元 (100000分)
            $item1->allocated_shipping_cost + $item2->allocated_shipping_cost + $item3->allocated_shipping_cost
        );
    }

    /**
     * 測試無效的運費值
     */
    public function test_cannot_update_shipping_cost_with_invalid_values()
    {
        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 50000, // 500元 (50000分)
            'total_amount' => 350000, // 3500元 (350000分)
            'status' => 'pending',
        ]);

        // 測試負數運費
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => -100,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['shipping_cost']);

        // 測試非數字運費
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 'invalid',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['shipping_cost']);

        // 測試缺少運費參數
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['shipping_cost']);
    }

    /**
     * 測試未授權的運費更新
     */
    public function test_cannot_update_shipping_cost_without_authorization()
    {
        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 50000, // 500元 (50000分)
            'total_amount' => 350000, // 3500元 (350000分)
            'status' => 'pending',
        ]);

        // 創建另一個用戶 (無權限)
        $unauthorizedUser = User::factory()->create();

        // 測試無權限更新
        $response = $this->actingAs($unauthorizedUser)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 1000,
            ]);

        $response->assertStatus(403);
    }

    /**
     * 測試不存在的進貨單
     */
    public function test_cannot_update_shipping_cost_for_non_existent_purchase()
    {
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/999999/shipping-cost", [
                'shipping_cost' => 1000,
            ]);

        $response->assertStatus(404);
    }

    /**
     * 測試運費更新對已完成進貨單的影響
     */
    public function test_can_update_shipping_cost_for_completed_purchase()
    {
        // 創建已完成的進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 50000, // 500元 (50000分)
            'total_amount' => 350000, // 3500元 (350000分)
            'status' => 'completed',
        ]);

        // 創建進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 10,
            'cost_price' => 10000, // 100元 (10000分)
            'allocated_shipping_cost' => 25000, // 250元 (25000分)
        ]);

        // 應該能夠更新已完成進貨單的運費
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 800,
            ]);

        $response->assertStatus(200);
        
        // 驗證運費已更新
        $this->purchase->refresh();
        $this->assertEquals(80000, $this->purchase->shipping_cost); // 800元 (80000分)
    }

    /**
     * 測試運費更新的日誌記錄
     */
    public function test_shipping_cost_update_is_logged()
    {
        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 50000, // 500元 (50000分)
            'total_amount' => 350000, // 3500元 (350000分)
            'status' => 'pending',
        ]);

        // 創建進貨項目
        PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 10,
            'cost_price' => 10000, // 100元 (10000分)
            'allocated_shipping_cost' => 25000, // 250元 (25000分)
        ]);

        // 清除之前的日誌
        \Illuminate\Support\Facades\Log::spy();

        // 更新運費
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 1200,
            ]);

        $response->assertStatus(200);
        
        // 驗證日誌記錄 (日誌中使用的是數據庫實際存儲的分值)
        \Illuminate\Support\Facades\Log::shouldHaveReceived('info')
            ->with('進貨單運費更新完成', \Mockery::subset([
                'purchase_id' => $this->purchase->id,
                'old_shipping_cost' => 50000, // 原 500元 (50000分)
                'new_shipping_cost' => 120000, // 新 1200元 (120000分)
            ]));
    }

    /**
     * 測試多項目運費分配的精確性
     */
    public function test_precise_shipping_cost_allocation_for_multiple_items()
    {
        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 0,
            'total_amount' => 300000, // 3000元 (300000分)
            'status' => 'pending',
        ]);

        // 創建5個不同數量的進貨項目
        $items = [];
        $quantities = [3, 7, 2, 8, 5]; // 總計25個
        
        foreach ($quantities as $index => $quantity) {
            $items[] = PurchaseItem::factory()->create([
                'purchase_id' => $this->purchase->id,
                'product_variant_id' => $this->productVariant1->id,
                'quantity' => $quantity,
                'cost_price' => 10000, // 100元 (10000分)
                'allocated_shipping_cost' => 0,
            ]);
        }

        // 更新運費為2500元
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 2500,
            ]);

        $response->assertStatus(200);
        
        // 重新載入並驗證運費分配
        $totalAllocated = 0;
        foreach ($items as $index => $item) {
            $item->refresh();
            $expectedAllocation = ($index === count($items) - 1) 
                ? 250000 - $totalAllocated // 最後一項調整誤差
                : intval(250000 * $quantities[$index] / 25); // 按比例分配
            
            if ($index < count($items) - 1) {
                $totalAllocated += $item->allocated_shipping_cost;
            }
        }
        
        // 驗證總運費分配正確
        $finalTotal = collect($items)->sum(function ($item) {
            return $item->fresh()->allocated_shipping_cost;
        });
        
        $this->assertEquals(250000, $finalTotal); // 2500元 (250000分)
    }
}