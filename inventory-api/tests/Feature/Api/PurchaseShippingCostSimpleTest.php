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

class PurchaseShippingCostSimpleTest extends TestCase
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
            'cost_price' => 100.00,
        ]);
        
        $this->productVariant2 = ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sku' => 'TEST-002',
            'cost_price' => 200.00,
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
            'shipping_cost' => 50000, // 500元 = 50000分
            'total_amount' => 350000, // 3500元 = 350000分
            'status' => 'pending',
        ]);

        // 創建進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 10,
            'cost_price' => 10000, // 100元 = 10000分
            'allocated_shipping_cost' => 25000, // 250元 = 25000分
        ]);

        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 10,
            'cost_price' => 20000, // 200元 = 20000分
            'allocated_shipping_cost' => 25000, // 250元 = 25000分
        ]);

        // 測試更新運費
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 1000, // 更新為1000元
            ]);

        $response->assertStatus(200);
        
        // 檢查實際的 API 響應
        $responseData = $response->json();
        dump("API 響應內容:", $responseData);
        
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
        dump("資料庫中的 shipping_cost:", $this->purchase->shipping_cost);
        dump("資料庫中的 total_amount:", $this->purchase->total_amount);
        
        $this->assertEquals(100000, $this->purchase->shipping_cost); // 1000元 = 100000分
        $this->assertEquals(400000, $this->purchase->total_amount); // 3000元商品 + 1000元運費 = 400000分
        
        // 驗證運費重新分配
        $item1->refresh();
        $item2->refresh();
        
        // 驗證運費分配 (按數量比例：10:10 = 1:1)
        $this->assertEquals(50000, $item1->allocated_shipping_cost); // 500元 = 50000分
        $this->assertEquals(50000, $item2->allocated_shipping_cost); // 500元 = 50000分
        
        // 驗證總運費分配正確
        $this->assertEquals(
            $this->purchase->shipping_cost,
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
            'shipping_cost' => 50000, // 500元 = 50000分
            'total_amount' => 350000, // 3500元 = 350000分
            'status' => 'pending',
        ]);

        // 創建進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 10,
            'cost_price' => 10000, // 100元 = 10000分
            'allocated_shipping_cost' => 25000, // 250元 = 25000分
        ]);

        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 10,
            'cost_price' => 20000, // 200元 = 20000分
            'allocated_shipping_cost' => 25000, // 250元 = 25000分
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
        $this->assertEquals(300000, $this->purchase->total_amount); // 只有商品成本 3000元 = 300000分
        $this->assertEquals(0, $item1->allocated_shipping_cost);
        $this->assertEquals(0, $item2->allocated_shipping_cost);
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
            'shipping_cost' => 50000, // 500元 = 50000分
            'total_amount' => 350000, // 3500元 = 350000分
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
            'shipping_cost' => 50000, // 500元 = 50000分
            'total_amount' => 350000, // 3500元 = 350000分
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
            'shipping_cost' => 500,
            'total_amount' => 3500,
            'status' => 'completed',
        ]);

        // 創建進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 10,
            'cost_price' => 10000, // 100元 = 10000分
            'allocated_shipping_cost' => 25000, // 250元 = 25000分
        ]);

        // 應該能夠更新已完成進貨單的運費
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 800,
            ]);

        $response->assertStatus(200);
        
        // 驗證運費已更新
        $this->purchase->refresh();
        $this->assertEquals(80000, $this->purchase->shipping_cost); // 800元 = 80000分
    }

    /**
     * 測試運費分配精確性
     */
    public function test_shipping_cost_allocation_precision()
    {
        // 創建進貨單
        $this->purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'shipping_cost' => 0,
            'total_amount' => 300000, // 3000元 = 300000分
            'status' => 'pending',
        ]);

        // 創建三個不同數量的進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 1,
            'cost_price' => 10000, // 100元 = 10000分
            'allocated_shipping_cost' => 0,
        ]);

        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant2->id,
            'quantity' => 1,
            'cost_price' => 20000, // 200元 = 20000分
            'allocated_shipping_cost' => 0,
        ]);

        $item3 = PurchaseItem::factory()->create([
            'purchase_id' => $this->purchase->id,
            'product_variant_id' => $this->productVariant1->id,
            'quantity' => 1,
            'cost_price' => 15000, // 150元 = 15000分
            'allocated_shipping_cost' => 0,
        ]);

        // 更新運費為1000元
        $response = $this->actingAs($this->user)
            ->patchJson("/api/purchases/{$this->purchase->id}/shipping-cost", [
                'shipping_cost' => 1000,
            ]);

        $response->assertStatus(200);
        
        // 重新載入並驗證運費分配
        $item1->refresh();
        $item2->refresh();
        $item3->refresh();
        
        // 總數量：3, 每個項目數量：1
        // 理論分配：100000 / 3 = 33333.33...
        // 實際分配：第一個 33333，第二個 33334，最後一個 33333
        $this->assertEquals(33333, $item1->allocated_shipping_cost);
        $this->assertEquals(33334, $item2->allocated_shipping_cost); // 第二個收到餘餘
        $this->assertEquals(33333, $item3->allocated_shipping_cost); // 最後一個調整誤差
        
        // 驗證總運費分配正確
        $this->assertEquals(
            100000, // 1000元 = 100000分
            $item1->allocated_shipping_cost + $item2->allocated_shipping_cost + $item3->allocated_shipping_cost
        );
    }
}