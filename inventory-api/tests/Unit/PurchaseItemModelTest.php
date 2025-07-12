<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\PurchaseItem;
use App\Models\Purchase;
use App\Models\ProductVariant;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * PurchaseItem Model 單元測試
 * 
 * 測試進貨單項目模型的所有功能，包括：
 * - 關聯關係
 * - 金額轉換
 * - 成本計算
 */
class PurchaseItemModelTest extends TestCase
{
    use RefreshDatabase;
    
    /**
     * 測試進貨項目屬於進貨單的關聯
     */
    public function test_purchase_item_belongs_to_purchase()
    {
        $purchase = Purchase::factory()->create();
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id
        ]);
        
        $this->assertInstanceOf(Purchase::class, $purchaseItem->purchase);
        $this->assertEquals($purchase->id, $purchaseItem->purchase->id);
    }
    
    /**
     * 測試進貨項目屬於商品變體的關聯
     */
    public function test_purchase_item_belongs_to_product_variant()
    {
        $variant = ProductVariant::factory()->create();
        $purchaseItem = PurchaseItem::factory()->create([
            'product_variant_id' => $variant->id
        ]);
        
        $this->assertInstanceOf(ProductVariant::class, $purchaseItem->productVariant);
        $this->assertEquals($variant->id, $purchaseItem->productVariant->id);
    }
    
    /**
     * 測試通過變體獲取商品的關聯
     */
    public function test_purchase_item_has_product_through_variant()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id
        ]);
        $purchaseItem = PurchaseItem::factory()->create([
            'product_variant_id' => $variant->id
        ]);
        
        $this->assertInstanceOf(Product::class, $purchaseItem->product);
        $this->assertEquals($product->id, $purchaseItem->product->id);
    }
    
    /**
     * 測試正確的屬性轉型
     */
    public function test_purchase_item_has_correct_casts()
    {
        $purchaseItem = new PurchaseItem();
        $casts = $purchaseItem->getCasts();
        
        $this->assertEquals('integer', $casts['quantity']);
        $this->assertEquals('integer', $casts['unit_price']);
        $this->assertEquals('integer', $casts['cost_price']);
        $this->assertEquals('integer', $casts['allocated_shipping_cost']);
        $this->assertEquals('datetime', $casts['created_at']);
        $this->assertEquals('datetime', $casts['updated_at']);
    }
    
    /**
     * 測試單價的取值器（分轉元）
     */
    public function test_unit_price_accessor()
    {
        // 資料庫儲存 9999 分
        $purchaseItem = PurchaseItem::factory()->create([
            'unit_price' => 9999
        ]);
        
        // 重新載入以確保從資料庫讀取
        $purchaseItem->refresh();
        
        // 應該回傳 100 元（四捨五入）
        $this->assertEquals(100, $purchaseItem->unit_price);
    }
    
    /**
     * 測試成本價的取值器（分轉元）
     */
    public function test_cost_price_accessor()
    {
        // 資料庫儲存 8888 分
        $purchaseItem = PurchaseItem::factory()->create([
            'cost_price' => 8888
        ]);
        
        // 重新載入以確保從資料庫讀取
        $purchaseItem->refresh();
        
        // 應該回傳 89 元（四捨五入）
        $this->assertEquals(89, $purchaseItem->cost_price);
    }
    
    /**
     * 測試攤銷運費的取值器（分轉元）
     */
    public function test_allocated_shipping_cost_accessor()
    {
        // 資料庫儲存 1550 分
        $purchaseItem = PurchaseItem::factory()->create([
            'allocated_shipping_cost' => 1550
        ]);
        
        // 重新載入以確保從資料庫讀取
        $purchaseItem->refresh();
        
        // 應該回傳 16 元（四捨五入）
        $this->assertEquals(16, $purchaseItem->allocated_shipping_cost);
        
        // 測試為零的情況
        $purchaseItem->setRawAttributes(['allocated_shipping_cost' => 0]);
        $this->assertEquals(0, $purchaseItem->allocated_shipping_cost);
    }
    
    /**
     * 測試總成本價格計算屬性
     */
    public function test_total_cost_price_attribute()
    {
        // 設定原始資料庫值（以分為單位）
        $purchaseItem = PurchaseItem::factory()->create([
            'quantity' => 10,
            'cost_price' => 5000,  // 50元
            'allocated_shipping_cost' => 2000  // 20元
        ]);
        
        // 總成本 = (5000 * 10 + 2000) / 100 = 520元
        $this->assertEquals(520, $purchaseItem->total_cost_price);
    }
    
    /**
     * 測試總成本價格計算屬性（不同場景）
     */
    public function test_total_cost_price_various_scenarios()
    {
        // 場景1：沒有運費攤銷
        $item1 = PurchaseItem::factory()->create([
            'quantity' => 5,
            'cost_price' => 10000,  // 100元
            'allocated_shipping_cost' => 0
        ]);
        // 總成本 = (10000 * 5 + 0) / 100 = 500元
        $this->assertEquals(500, $item1->total_cost_price);
        
        // 場景2：大量商品與運費
        $item2 = PurchaseItem::factory()->create([
            'quantity' => 100,
            'cost_price' => 2000,  // 20元
            'allocated_shipping_cost' => 50000  // 500元
        ]);
        // 總成本 = (2000 * 100 + 50000) / 100 = 2500元
        $this->assertEquals(2500, $item2->total_cost_price);
        
        // 場景3：單一商品
        $item3 = PurchaseItem::factory()->create([
            'quantity' => 1,
            'cost_price' => 15000,  // 150元
            'allocated_shipping_cost' => 1000  // 10元
        ]);
        // 總成本 = (15000 * 1 + 1000) / 100 = 160元
        $this->assertEquals(160, $item3->total_cost_price);
    }
    
    /**
     * 測試總成本價格處理 null 值
     */
    public function test_total_cost_price_handles_null_values()
    {
        $purchaseItem = new PurchaseItem();
        $purchaseItem->quantity = 10;
        // cost_price 和 allocated_shipping_cost 都是 null
        
        // 應該回傳 0 而不是錯誤
        $this->assertEquals(0, $purchaseItem->total_cost_price);
    }
    
    /**
     * 測試進貨項目可以被批量賦值創建
     */
    public function test_purchase_item_can_be_created_with_mass_assignment()
    {
        $purchase = Purchase::factory()->create();
        $variant = ProductVariant::factory()->create();
        
        $data = [
            'purchase_id' => $purchase->id,
            'product_variant_id' => $variant->id,
            'quantity' => 50,
            'unit_price' => 20000, // 200元
            'cost_price' => 18000, // 180元
            'allocated_shipping_cost' => 5000, // 50元
        ];
        
        $purchaseItem = PurchaseItem::create($data);
        
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'product_variant_id' => $variant->id,
            'quantity' => 50,
        ]);
        
        // 驗證金額（注意 accessor 會轉換）
        $this->assertEquals(200, $purchaseItem->unit_price);
        $this->assertEquals(180, $purchaseItem->cost_price);
        $this->assertEquals(50, $purchaseItem->allocated_shipping_cost);
    }
    
    /**
     * 測試進貨項目使用 HasFactory trait
     */
    public function test_purchase_item_uses_has_factory_trait()
    {
        $purchaseItem = PurchaseItem::factory()->make();
        $this->assertInstanceOf(PurchaseItem::class, $purchaseItem);
    }
    
    /**
     * 測試一個進貨單可以有多個項目
     */
    public function test_purchase_can_have_multiple_items()
    {
        $purchase = Purchase::factory()->create();
        
        // 創建多個不同的進貨項目
        $item1 = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'quantity' => 10,
            'cost_price' => 5000,
        ]);
        
        $item2 = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'quantity' => 20,
            'cost_price' => 3000,
        ]);
        
        $item3 = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'quantity' => 5,
            'cost_price' => 10000,
        ]);
        
        // 驗證進貨單有3個項目
        $this->assertCount(3, $purchase->items);
        
        // 驗證每個項目都屬於同一個進貨單
        $this->assertEquals($purchase->id, $item1->purchase_id);
        $this->assertEquals($purchase->id, $item2->purchase_id);
        $this->assertEquals($purchase->id, $item3->purchase_id);
    }
    
    /**
     * 測試一個商品變體可以出現在多個進貨項目中
     */
    public function test_product_variant_can_appear_in_multiple_purchase_items()
    {
        $variant = ProductVariant::factory()->create();
        
        // 創建多個進貨單，每個都包含相同的商品變體
        $purchaseItem1 = PurchaseItem::factory()->create([
            'product_variant_id' => $variant->id,
            'quantity' => 10,
        ]);
        
        $purchaseItem2 = PurchaseItem::factory()->create([
            'product_variant_id' => $variant->id,
            'quantity' => 20,
        ]);
        
        $purchaseItem3 = PurchaseItem::factory()->create([
            'product_variant_id' => $variant->id,
            'quantity' => 30,
        ]);
        
        // 驗證所有項目都是相同的商品變體
        $this->assertEquals($variant->id, $purchaseItem1->product_variant_id);
        $this->assertEquals($variant->id, $purchaseItem2->product_variant_id);
        $this->assertEquals($variant->id, $purchaseItem3->product_variant_id);
        
        // 透過變體關聯驗證有3個進貨項目
        $this->assertCount(3, $variant->purchaseItems);
    }
    
    /**
     * 測試金額計算的精確性
     */
    public function test_amount_calculation_precision()
    {
        // 測試四捨五入的邊界情況
        $purchaseItem = PurchaseItem::factory()->create([
            'quantity' => 3,
            'cost_price' => 3333,  // 33.33元
            'allocated_shipping_cost' => 1667  // 16.67元
        ]);
        
        // 總成本 = (3333 * 3 + 1667) / 100 = 116.66，四捨五入為 117
        $this->assertEquals(117, $purchaseItem->total_cost_price);
    }
}