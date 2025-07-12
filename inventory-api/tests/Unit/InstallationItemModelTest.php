<?php

namespace Tests\Unit;

use App\Models\Installation;
use App\Models\InstallationItem;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * InstallationItem Model 完整測試
 * 
 * 測試安裝項目模型的所有關聯、屬性和業務邏輯方法
 */
class InstallationItemModelTest extends TestCase
{
    use RefreshDatabase;

    private InstallationItem $installationItem;
    private Installation $installation;
    private OrderItem $orderItem;
    private ProductVariant $productVariant;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試數據
        $this->installation = Installation::factory()->create();
        $this->orderItem = OrderItem::factory()->create();
        
        $product = Product::factory()->create();
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id
        ]);
        
        $this->installationItem = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'order_item_id' => $this->orderItem->id,
            'product_variant_id' => $this->productVariant->id,
            'status' => 'pending'
        ]);
    }

    /**
     * 測試 InstallationItem 模型有正確的 fillable 屬性
     */
    public function test_installation_item_has_correct_fillable_attributes(): void
    {
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

        $this->assertEquals($expectedFillable, $this->installationItem->getFillable());
    }

    /**
     * 測試 InstallationItem 模型有正確的屬性轉換
     */
    public function test_installation_item_has_correct_casts(): void
    {
        $expectedCasts = [
            'id' => 'int',
            'quantity' => 'integer',
        ];

        $casts = $this->installationItem->getCasts();
        
        foreach ($expectedCasts as $attribute => $cast) {
            $this->assertArrayHasKey($attribute, $casts);
            $this->assertEquals($cast, $casts[$attribute]);
        }
    }

    /**
     * 測試 InstallationItem 可以進行批量賦值
     */
    public function test_installation_item_can_be_mass_assigned(): void
    {
        $data = [
            'installation_id' => $this->installation->id,
            'product_name' => '測試商品',
            'sku' => 'TEST-SKU-001',
            'quantity' => 5,
            'specifications' => '規格說明',
            'status' => 'in_progress',
            'notes' => '安裝備註'
        ];

        $installationItem = InstallationItem::create($data);

        $this->assertInstanceOf(InstallationItem::class, $installationItem);
        $this->assertEquals($data['installation_id'], $installationItem->installation_id);
        $this->assertEquals($data['product_name'], $installationItem->product_name);
        $this->assertEquals($data['sku'], $installationItem->sku);
        $this->assertEquals($data['quantity'], $installationItem->quantity);
        $this->assertEquals($data['specifications'], $installationItem->specifications);
        $this->assertEquals($data['status'], $installationItem->status);
        $this->assertEquals($data['notes'], $installationItem->notes);
    }

    /**
     * 測試 InstallationItem 使用 HasFactory trait
     */
    public function test_installation_item_uses_has_factory_trait(): void
    {
        $traits = class_uses(InstallationItem::class);
        $this->assertContains('Illuminate\Database\Eloquent\Factories\HasFactory', $traits);
    }

    /**
     * 測試 InstallationItem 與 Installation 的多對一關聯
     */
    public function test_installation_item_belongs_to_installation(): void
    {
        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\BelongsTo', $this->installationItem->installation());
        $this->assertInstanceOf(Installation::class, $this->installationItem->installation);
        $this->assertEquals($this->installation->id, $this->installationItem->installation->id);
    }

    /**
     * 測試 InstallationItem 與 OrderItem 的多對一關聯
     */
    public function test_installation_item_belongs_to_order_item(): void
    {
        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\BelongsTo', $this->installationItem->orderItem());
        $this->assertInstanceOf(OrderItem::class, $this->installationItem->orderItem);
        $this->assertEquals($this->orderItem->id, $this->installationItem->orderItem->id);
    }

    /**
     * 測試 InstallationItem 與 ProductVariant 的多對一關聯
     */
    public function test_installation_item_belongs_to_product_variant(): void
    {
        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\BelongsTo', $this->installationItem->productVariant());
        $this->assertInstanceOf(ProductVariant::class, $this->installationItem->productVariant);
        $this->assertEquals($this->productVariant->id, $this->installationItem->productVariant->id);
    }

    /**
     * 測試 InstallationItem 可以沒有關聯的 OrderItem（可選關聯）
     */
    public function test_installation_item_can_have_null_order_item(): void
    {
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'order_item_id' => null
        ]);
        
        $this->assertNull($installationItem->order_item_id);
        $this->assertNull($installationItem->orderItem);
    }

    /**
     * 測試 InstallationItem 可以沒有關聯的 ProductVariant（可選關聯）
     */
    public function test_installation_item_can_have_null_product_variant(): void
    {
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'product_variant_id' => null
        ]);
        
        $this->assertNull($installationItem->product_variant_id);
        $this->assertNull($installationItem->productVariant);
    }

    /**
     * 測試 isCompleted 方法
     */
    public function test_is_completed_method(): void
    {
        // 測試未完成狀態
        $this->installationItem->status = 'pending';
        $this->assertFalse($this->installationItem->isCompleted());
        
        $this->installationItem->status = 'in_progress';
        $this->assertFalse($this->installationItem->isCompleted());
        
        // 測試已完成狀態
        $this->installationItem->status = 'completed';
        $this->assertTrue($this->installationItem->isCompleted());
    }

    /**
     * 測試 isPending 方法
     */
    public function test_is_pending_method(): void
    {
        // 測試待處理狀態
        $this->installationItem->status = 'pending';
        $this->assertTrue($this->installationItem->isPending());
        
        // 測試非待處理狀態
        $this->installationItem->status = 'in_progress';
        $this->assertFalse($this->installationItem->isPending());
        
        $this->installationItem->status = 'completed';
        $this->assertFalse($this->installationItem->isPending());
    }

    /**
     * 測試 markAsCompleted 方法
     */
    public function test_mark_as_completed_method(): void
    {
        $this->installationItem->status = 'pending';
        $this->assertFalse($this->installationItem->isCompleted());
        
        $result = $this->installationItem->markAsCompleted();
        
        $this->assertTrue($result);
        $this->installationItem->refresh();
        $this->assertTrue($this->installationItem->isCompleted());
        $this->assertEquals('completed', $this->installationItem->status);
    }

    /**
     * 測試 markAsPending 方法
     */
    public function test_mark_as_pending_method(): void
    {
        $this->installationItem->status = 'completed';
        $this->assertFalse($this->installationItem->isPending());
        
        $result = $this->installationItem->markAsPending();
        
        $this->assertTrue($result);
        $this->installationItem->refresh();
        $this->assertTrue($this->installationItem->isPending());
        $this->assertEquals('pending', $this->installationItem->status);
    }

    /**
     * 測試數量屬性的整數轉換
     */
    public function test_quantity_casting_to_integer(): void
    {
        $installationItem = InstallationItem::factory()->create([
            'quantity' => '10'  // 字串形式的數字
        ]);

        $this->assertIsInt($installationItem->quantity);
        $this->assertEquals(10, $installationItem->quantity);
    }

    /**
     * 測試 InstallationItem 的狀態變化
     */
    public function test_installation_item_status_transitions(): void
    {
        $statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        
        foreach ($statuses as $status) {
            $this->installationItem->status = $status;
            $this->assertEquals($status, $this->installationItem->status);
        }
    }

    /**
     * 測試 InstallationItem 的業務邏輯一致性
     */
    public function test_installation_item_business_logic_consistency(): void
    {
        // 測試 pending 狀態的業務邏輯
        $this->installationItem->status = 'pending';
        $this->assertTrue($this->installationItem->isPending());
        $this->assertFalse($this->installationItem->isCompleted());

        // 測試 completed 狀態的業務邏輯
        $this->installationItem->status = 'completed';
        $this->assertFalse($this->installationItem->isPending());
        $this->assertTrue($this->installationItem->isCompleted());

        // 測試 in_progress 狀態的業務邏輯
        $this->installationItem->status = 'in_progress';
        $this->assertFalse($this->installationItem->isPending());
        $this->assertFalse($this->installationItem->isCompleted());
    }

    /**
     * 測試多個安裝項目屬於同一個安裝單
     */
    public function test_multiple_installation_items_belong_to_same_installation(): void
    {
        $item1 = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id
        ]);
        $item2 = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id
        ]);

        $this->assertEquals($this->installation->id, $item1->installation->id);
        $this->assertEquals($this->installation->id, $item2->installation->id);
        $this->assertEquals($item1->installation->id, $item2->installation->id);
    }

    /**
     * 測試安裝項目的必要欄位
     */
    public function test_installation_item_required_fields(): void
    {
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'product_name' => '必要商品',
            'quantity' => 1,
            'status' => 'pending'
        ]);

        $this->assertNotNull($installationItem->installation_id);
        $this->assertNotNull($installationItem->product_name);
        $this->assertNotNull($installationItem->quantity);
        $this->assertNotNull($installationItem->status);
        $this->assertGreaterThan(0, $installationItem->quantity);
    }

    /**
     * 測試安裝項目的可選欄位
     */
    public function test_installation_item_optional_fields(): void
    {
        $installationItem = InstallationItem::factory()->create([
            'installation_id' => $this->installation->id,
            'order_item_id' => null,
            'product_variant_id' => null,
            'sku' => 'OPTIONAL-SKU',  // 某些欄位可能在資料庫中要求非空
            'specifications' => null,
            'notes' => null
        ]);

        $this->assertNull($installationItem->order_item_id);
        $this->assertNull($installationItem->product_variant_id);
        $this->assertNotNull($installationItem->sku);  // 根據實際資料庫結構調整
        $this->assertNull($installationItem->specifications);
        $this->assertNull($installationItem->notes);
    }

    /**
     * 測試安裝項目狀態標記方法的串聯使用
     */
    public function test_installation_item_status_chaining(): void
    {
        // 從 pending 到 completed 再回到 pending
        $this->installationItem->status = 'pending';
        $this->assertTrue($this->installationItem->isPending());
        
        $this->installationItem->markAsCompleted();
        $this->assertTrue($this->installationItem->isCompleted());
        
        $this->installationItem->markAsPending();
        $this->assertTrue($this->installationItem->isPending());
        $this->assertFalse($this->installationItem->isCompleted());
    }

    /**
     * 測試安裝項目與關聯模型的完整性
     */
    public function test_installation_item_relationships_integrity(): void
    {
        // 測試所有關聯都正確設置
        $this->assertEquals($this->installation->id, $this->installationItem->installation_id);
        $this->assertEquals($this->orderItem->id, $this->installationItem->order_item_id);
        $this->assertEquals($this->productVariant->id, $this->installationItem->product_variant_id);

        // 測試反向關聯
        $this->assertTrue($this->installation->items->contains($this->installationItem));
    }
}