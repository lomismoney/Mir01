<?php

namespace Tests\Unit\Models;

use App\Models\InstallationItem;
use App\Models\Installation;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Store;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * InstallationItem 模型測試
 * 
 * 測試安裝項目模型的所有功能
 */
class InstallationItemModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試模型的基本屬性
     */
    public function test_model_fillable_attributes(): void
    {
        $installationItem = new InstallationItem();
        
        $expectedFillable = [
            'installation_id',
            'order_item_id',
            'product_variant_id',
            'product_name',
            'sku',
            'quantity',
            'specifications',
            'status',
            'notes',
        ];

        $this->assertEquals($expectedFillable, $installationItem->getFillable());
    }

    /**
     * 測試模型的屬性轉換
     */
    public function test_model_casts(): void
    {
        $installationItem = new InstallationItem();
        
        $expectedCasts = [
            'quantity' => 'integer',
        ];

        // 只檢查我們定義的 casts，忽略系統預設的（如 id）
        $actualCasts = $installationItem->getCasts();
        foreach ($expectedCasts as $key => $value) {
            $this->assertArrayHasKey($key, $actualCasts);
            $this->assertEquals($value, $actualCasts[$key]);
        }
    }

    /**
     * 測試創建安裝項目
     */
    public function test_create_installation_item(): void
    {
        // 創建必要的關聯模型
        $installation = Installation::factory()->create();

        // 創建安裝項目
        $installationItem = InstallationItem::create([
            'installation_id' => $installation->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-001',
            'quantity' => 2,
            'specifications' => '規格說明',
            'status' => 'pending',
            'notes' => '備註',
        ]);

        // 驗證創建成功
        $this->assertInstanceOf(InstallationItem::class, $installationItem);
        $this->assertEquals($installation->id, $installationItem->installation_id);
        $this->assertEquals('測試商品', $installationItem->product_name);
        $this->assertEquals('TEST-001', $installationItem->sku);
        $this->assertEquals(2, $installationItem->quantity);
        $this->assertEquals('規格說明', $installationItem->specifications);
        $this->assertEquals('pending', $installationItem->status);
        $this->assertEquals('備註', $installationItem->notes);
    }

    /**
     * 測試與 Installation 的關聯
     */
    public function test_installation_relationship(): void
    {
        // 創建測試數據
        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
        ]);

        // 測試關聯
        $this->assertInstanceOf(Installation::class, $installationItem->installation);
        $this->assertEquals($installation->id, $installationItem->installation->id);
    }

    /**
     * 測試與 OrderItem 的關聯
     */
    public function test_order_item_relationship(): void
    {
        // 創建測試數據
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-001',
            'price' => 100.00,
        ]);

        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'order_item_id' => $orderItem->id,
        ]);

        // 測試關聯
        $this->assertInstanceOf(OrderItem::class, $installationItem->orderItem);
        $this->assertEquals($orderItem->id, $installationItem->orderItem->id);
    }

    /**
     * 測試與 ProductVariant 的關聯
     */
    public function test_product_variant_relationship(): void
    {
        // 創建測試數據
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $productVariant = ProductVariant::factory()->create(['product_id' => $product->id]);

        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'product_variant_id' => $productVariant->id,
        ]);

        // 測試關聯
        $this->assertInstanceOf(ProductVariant::class, $installationItem->productVariant);
        $this->assertEquals($productVariant->id, $installationItem->productVariant->id);
    }

    /**
     * 測試 isCompleted 方法
     */
    public function test_is_completed_method(): void
    {
        $installation = Installation::factory()->create();

        // 測試已完成狀態
        $completedItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'status' => 'completed',
        ]);

        $this->assertTrue($completedItem->isCompleted());

        // 測試未完成狀態
        $pendingItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'status' => 'pending',
        ]);

        $this->assertFalse($pendingItem->isCompleted());
    }

    /**
     * 測試 isPending 方法
     */
    public function test_is_pending_method(): void
    {
        $installation = Installation::factory()->create();

        // 測試待處理狀態
        $pendingItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'status' => 'pending',
        ]);

        $this->assertTrue($pendingItem->isPending());

        // 測試非待處理狀態
        $completedItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'status' => 'completed',
        ]);

        $this->assertFalse($completedItem->isPending());
    }

    /**
     * 測試 markAsCompleted 方法
     */
    public function test_mark_as_completed_method(): void
    {
        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'status' => 'pending',
        ]);

        // 標記為已完成
        $result = $installationItem->markAsCompleted();

        $this->assertTrue($result);
        $this->assertEquals('completed', $installationItem->fresh()->status);
        $this->assertTrue($installationItem->fresh()->isCompleted());
    }

    /**
     * 測試 markAsPending 方法
     */
    public function test_mark_as_pending_method(): void
    {
        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'status' => 'completed',
        ]);

        // 標記為待處理
        $result = $installationItem->markAsPending();

        $this->assertTrue($result);
        $this->assertEquals('pending', $installationItem->fresh()->status);
        $this->assertTrue($installationItem->fresh()->isPending());
    }

    /**
     * 測試數量屬性的型別轉換
     */
    public function test_quantity_casting(): void
    {
        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'quantity' => '5', // 字串型別
        ]);

        // 驗證自動轉換為整數
        $this->assertIsInt($installationItem->quantity);
        $this->assertEquals(5, $installationItem->quantity);
    }

    /**
     * 測試批量賦值
     */
    public function test_mass_assignment(): void
    {
        $installation = Installation::factory()->create();

        $data = [
            'installation_id' => $installation->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-001',
            'quantity' => 3,
            'specifications' => '規格說明',
            'status' => 'pending',
            'notes' => '備註',
        ];

        $installationItem = InstallationItem::create($data);

        // 驗證所有可批量賦值的欄位都已設置
        $this->assertEquals($installation->id, $installationItem->installation_id);
        $this->assertEquals('測試商品', $installationItem->product_name);
        $this->assertEquals('TEST-001', $installationItem->sku);
        $this->assertEquals(3, $installationItem->quantity);
        $this->assertEquals('規格說明', $installationItem->specifications);
        $this->assertEquals('pending', $installationItem->status);
        $this->assertEquals('備註', $installationItem->notes);
    }

    /**
     * 測試可選關聯（order_item_id 為空）
     */
    public function test_optional_order_item_relationship(): void
    {
        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'order_item_id' => null,
        ]);

        // 測試可選關聯
        $this->assertNull($installationItem->orderItem);
    }

    /**
     * 測試可選關聯（product_variant_id 為空）
     */
    public function test_optional_product_variant_relationship(): void
    {
        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'product_variant_id' => null,
        ]);

        // 測試可選關聯
        $this->assertNull($installationItem->productVariant);
    }

    /**
     * 測試狀態切換的完整流程
     */
    public function test_status_transition_workflow(): void
    {
        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'status' => 'pending',
        ]);

        // 初始狀態
        $this->assertTrue($installationItem->isPending());
        $this->assertFalse($installationItem->isCompleted());

        // 標記為已完成
        $installationItem->markAsCompleted();
        $this->assertTrue($installationItem->isCompleted());
        $this->assertFalse($installationItem->isPending());

        // 重新標記為待處理
        $installationItem->markAsPending();
        $this->assertTrue($installationItem->isPending());
        $this->assertFalse($installationItem->isCompleted());
    }

    /**
     * 測試與完整關聯的複合場景
     */
    public function test_complete_relationship_scenario(): void
    {
        // 創建完整的測試數據
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $productVariant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $productVariant->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-001',
            'price' => 100.00,
        ]);

        $installation = Installation::factory()->create();

        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $installation->id,
            'order_item_id' => $orderItem->id,
            'product_variant_id' => $productVariant->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-001',
            'quantity' => 2,
            'status' => 'pending',
        ]);

        // 驗證所有關聯都正確
        $this->assertEquals($installation->id, $installationItem->installation->id);
        $this->assertEquals($orderItem->id, $installationItem->orderItem->id);
        $this->assertEquals($productVariant->id, $installationItem->productVariant->id);
        $this->assertEquals('測試商品', $installationItem->product_name);
        $this->assertEquals('TEST-001', $installationItem->sku);
        $this->assertEquals(2, $installationItem->quantity);
        $this->assertTrue($installationItem->isPending());
    }
} 