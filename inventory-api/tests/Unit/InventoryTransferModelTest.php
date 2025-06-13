<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\InventoryTransfer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnitFrameworkAttributesTest;
class InventoryTransferModelTest extends TestCase
{
    use RefreshDatabase;
    
    protected Store $fromStore;
    protected Store $toStore;
    protected ProductVariant $variant;
    protected User $user;
    protected InventoryTransfer $transfer;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // 建立測試門市
        $this->fromStore = Store::create([
            'name' => '來源門市',
            'address' => '來源地址'
        ]);
        
        $this->toStore = Store::create([
            'name' => '目標門市',
            'address' => '目標地址'
        ]);
        
        // 建立測試商品結構
        $product = Product::factory()->create();
        $this->variant = $product->variants()->create([
            'sku' => 'TRANSFER-TEST-001',
            'price' => 150.00
        ]);
        
        // 建立測試用戶
        $this->user = User::factory()->admin()->create();
        
        // 建立測試轉移記錄
        $this->transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 25,
            'status' => 'pending',
            'notes' => '測試轉移'
        ]);
    }
    
    /** @test */
    public function transfer_belongs_to_from_store()
    {
        $this->assertInstanceOf(Store::class, $this->transfer->fromStore);
        $this->assertEquals($this->fromStore->id, $this->transfer->fromStore->id);
        $this->assertEquals('來源門市', $this->transfer->fromStore->name);
    }
    
    /** @test */
    public function transfer_belongs_to_to_store()
    {
        $this->assertInstanceOf(Store::class, $this->transfer->toStore);
        $this->assertEquals($this->toStore->id, $this->transfer->toStore->id);
        $this->assertEquals('目標門市', $this->transfer->toStore->name);
    }
    
    /** @test */
    public function transfer_belongs_to_user()
    {
        $this->assertInstanceOf(User::class, $this->transfer->user);
        $this->assertEquals($this->user->id, $this->transfer->user->id);
    }
    
    /** @test */
    public function transfer_belongs_to_product_variant()
    {
        $this->assertInstanceOf(ProductVariant::class, $this->transfer->productVariant);
        $this->assertEquals($this->variant->id, $this->transfer->productVariant->id);
        $this->assertEquals('TRANSFER-TEST-001', $this->transfer->productVariant->sku);
    }
    
    /** @test */
    public function transfer_has_correct_fillable_attributes()
    {
        $fillable = $this->transfer->getFillable();
        
        $expectedFillable = [
            'from_store_id',
            'to_store_id',
            'user_id',
            'product_variant_id',
            'quantity',
            'status',
            'notes'
        ];
        
        $this->assertEquals($expectedFillable, $fillable);
    }
    
    /** @test */
    public function transfer_has_correct_casts()
    {
        $casts = $this->transfer->getCasts();
        
        $this->assertEquals('integer', $casts['from_store_id']);
        $this->assertEquals('integer', $casts['to_store_id']);
        $this->assertEquals('integer', $casts['user_id']);
        $this->assertEquals('integer', $casts['product_variant_id']);
        $this->assertEquals('integer', $casts['quantity']);
        $this->assertEquals('datetime', $casts['created_at']);
        $this->assertEquals('datetime', $casts['updated_at']);
    }
    
    /** @test */
    public function transfer_constants_are_defined()
    {
        $this->assertEquals('pending', InventoryTransfer::STATUS_PENDING);
        $this->assertEquals('in_transit', InventoryTransfer::STATUS_IN_TRANSIT);
        $this->assertEquals('completed', InventoryTransfer::STATUS_COMPLETED);
        $this->assertEquals('cancelled', InventoryTransfer::STATUS_CANCELLED);
    }
    
    /** @test */
    public function of_status_scope_filters_correctly()
    {
        // 建立不同狀態的轉移記錄
        $inTransitTransfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 15,
            'status' => 'in_transit'
        ]);
        
        $pendingTransfers = InventoryTransfer::ofStatus('pending')->get();
        $inTransitTransfers = InventoryTransfer::ofStatus('in_transit')->get();
        
        $this->assertTrue($pendingTransfers->contains($this->transfer));
        $this->assertFalse($pendingTransfers->contains($inTransitTransfer));
        $this->assertTrue($inTransitTransfers->contains($inTransitTransfer));
        $this->assertFalse($inTransitTransfers->contains($this->transfer));
    }
    
    /** @test */
    public function from_store_scope_filters_correctly()
    {
        $otherStore = Store::create(['name' => '其他門市', 'address' => '其他地址']);
        
        $otherTransfer = InventoryTransfer::create([
            'from_store_id' => $otherStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 15,
            'status' => 'pending'
        ]);
        
        $fromStoreTransfers = InventoryTransfer::query()->fromStore($this->fromStore->id)->get();
        $this->assertTrue($fromStoreTransfers->contains($this->transfer));
        $this->assertFalse($fromStoreTransfers->contains($otherTransfer));
    }
    
    /** @test */
    public function to_store_scope_filters_correctly()
    {
        $otherToStore = Store::create(['name' => '另一個目標門市', 'address' => '另一個目標地址']);
        
        $otherTransfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $otherToStore->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'status' => 'pending'
        ]);
        
        $toStoreTransfers = InventoryTransfer::query()->toStore($this->toStore->id)->get();
        $this->assertTrue($toStoreTransfers->contains($this->transfer));
        $this->assertFalse($toStoreTransfers->contains($otherTransfer));
    }
    
    /** @test */
    public function transfer_can_store_and_retrieve_notes()
    {
        $this->assertEquals('測試轉移', $this->transfer->notes);
        
        $this->transfer->update(['notes' => '更新的轉移備註']);
        $this->assertEquals('更新的轉移備註', $this->transfer->fresh()->notes);
        
        // 測試 null 備註
        $this->transfer->update(['notes' => null]);
        $this->assertNull($this->transfer->fresh()->notes);
    }
}
