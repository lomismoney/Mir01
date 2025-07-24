<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Category;
use App\Models\Inventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;

class OrderStockDecisionIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createTestData();
    }

    protected function createTestData(): void
    {
        // 創建管理員用戶（使用 TestCase 提供的輔助方法）
        $user = $this->createAdminUser();
        Auth::login($user);
        
        // 為 API 設定認證
        $this->actingAs($user, 'sanctum');

        // 創建兩個門市
        Store::factory()->create(['id' => 1, 'name' => '主門市']);
        Store::factory()->create(['id' => 2, 'name' => '分店A']);

        // 創建客戶
        Customer::factory()->create(['id' => 1, 'name' => '測試客戶']);

        // 創建商品
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $variant = ProductVariant::factory()->create([
            'id' => 1,
            'product_id' => $product->id,
            'sku' => 'TEST-001'
        ]);

        // 創建庫存：主門市無庫存，分店A有庫存
        Inventory::factory()->create([
            'product_variant_id' => 1,
            'store_id' => 1,
            'quantity' => 0 // 主門市無庫存
        ]);

        Inventory::factory()->create([
            'product_variant_id' => 1,
            'store_id' => 2,
            'quantity' => 10 // 分店A有庫存
        ]);
    }

    /**
     * 測試用戶選擇調貨時，系統是否正確處理
     */
    public function test_user_stock_decision_transfer_should_work()
    {
        $orderData = [
            'customer_id' => 1,
            'store_id' => 1,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'shipping_fee' => 0,
            'tax' => 500, // 5元的稅
            'discount_amount' => 0,
            'is_tax_inclusive' => false,
            'tax_rate' => 5,
            'payment_method' => 'cash',
            'order_source' => 'direct',
            'shipping_address' => 'Test Address',
            'notes' => '',
            'items' => [
                [
                    'product_variant_id' => 1,
                    'is_stocked_sale' => true,  // 設為現貨，讓它通過庫存檢查
                    'is_backorder' => false,
                    'status' => 'pending',
                    'quantity' => 5,
                    'price' => 10000, // 100元，轉換為分
                    'product_name' => 'Test Product',
                    'sku' => 'TEST-001',
                ]
            ],
            // 重點：究戶選擇調貨
            'stock_decisions' => [
                [
                    'product_variant_id' => 1,
                    'action' => 'transfer',
                    'transfers' => [
                        [
                            'from_store_id' => 2,
                            'quantity' => 5
                        ]
                    ]
                ]
            ]
        ];

        // 執行 API 請求
        $response = $this->postJson('/api/orders', $orderData);
        
        // 如果失敗，顯示錯誤訊息
        if ($response->status() !== 201) {
            // Response debugging removed
        }

        // 驗證響應
        $response->assertStatus(201);
        
        $responseData = $response->json();
        $this->assertArrayHasKey('data', $responseData);
        $this->assertArrayHasKey('id', $responseData['data']);
        
        $orderId = $responseData['data']['id'];
        
        // 驗證訂單是否正確創建
        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'customer_id' => 1,
            'store_id' => 1
        ]);
        
        // 檢查是否有庫存轉移記錄被創建（這說明調貨決策被正確處理）
        // 注意：這個測試驗證 initiateAutomatedTransfer 是否被調用的效果
        $this->assertDatabaseHas('inventory_transfers', [
            'order_id' => $orderId,
            'from_store_id' => 2,
            'to_store_id' => 1,
            'product_variant_id' => 1,
            'quantity' => 5
        ]);
    }

    /**
     * 測試用戶選擇進貨時，不應該創建調貨記錄
     */
    public function test_user_stock_decision_purchase_should_not_create_transfer()
    {
        $orderData = [
            'customer_id' => 1,
            'store_id' => 1,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'shipping_fee' => 0,
            'tax' => 500, // 5元的稅
            'discount_amount' => 0,
            'is_tax_inclusive' => false,
            'tax_rate' => 5,
            'payment_method' => 'cash',
            'order_source' => 'direct',
            'shipping_address' => 'Test Address',
            'notes' => '',
            'items' => [
                [
                    'product_variant_id' => 1,
                    'is_stocked_sale' => true,  // 設為現貨，讓它通過庫存檢查
                    'is_backorder' => false,
                    'status' => 'pending',
                    'quantity' => 5,
                    'price' => 10000, // 100元，轉換為分
                    'product_name' => 'Test Product',
                    'sku' => 'TEST-001',
                ]
            ],
            // 重點：用戶選擇進貨
            'stock_decisions' => [
                [
                    'product_variant_id' => 1,
                    'action' => 'purchase',
                    'purchase_quantity' => 5
                ]
            ]
        ];

        // 執行 API 請求
        $response = $this->postJson('/api/orders', $orderData);

        // 驗證響應
        $response->assertStatus(201);
        
        $responseData = $response->json();
        $orderId = $responseData['data']['id'];
        
        // 驗證不應該有庫存轉移記錄（因為用戶選擇進貨）
        $this->assertDatabaseMissing('inventory_transfers', [
            'order_id' => $orderId,
        ]);
        
        // 驗證商品應該顯示為待建立進貨單（因為沒有調貨）
        $orderItem = \App\Models\OrderItem::where('order_id', $orderId)->first();
        $this->assertNull($orderItem->purchase_item_id); // 還沒關聯進貨單
    }
}