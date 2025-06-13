<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
class InventoryTransactionModelTest extends TestCase
{
    use RefreshDatabase;
    
    protected Inventory $inventory;
    protected User $user;
    protected InventoryTransaction $transaction;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // 建立測試基礎資料
        $store = Store::create(['name' => '測試門市', 'address' => '測試地址']);
        $product = Product::factory()->create();
        $variant = $product->variants()->create([
            'sku' => 'TEST-SKU-001',
            'price' => 100.00
        ]);
        
        $this->inventory = Inventory::create([
            'product_variant_id' => $variant->id,
            'store_id' => $store->id,
            'quantity' => 50,
            'low_stock_threshold' => 10
        ]);
        
        $this->user = User::factory()->admin()->create();
        
        // 建立測試交易記錄
        $this->transaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'addition',
            'quantity' => 25,
            'before_quantity' => 25,
            'after_quantity' => 50,
            'notes' => '測試進貨',
            'metadata' => json_encode(['order_id' => 'ORD-001'])
        ]);
    }
    
    /** @test */
    public function transaction_belongs_to_inventory()
    {
        $this->assertInstanceOf(Inventory::class, $this->transaction->inventory);
        $this->assertEquals($this->inventory->id, $this->transaction->inventory->id);
    }
    
    /** @test */
    public function transaction_belongs_to_user()
    {
        $this->assertInstanceOf(User::class, $this->transaction->user);
        $this->assertEquals($this->user->id, $this->transaction->user->id);
    }
    
    /** @test */
    public function transaction_has_correct_fillable_attributes()
    {
        $fillable = $this->transaction->getFillable();
        
        $expectedFillable = [
            'inventory_id',
            'user_id',
            'type',
            'quantity',
            'before_quantity',
            'after_quantity',
            'notes',
            'metadata'
        ];
        
        $this->assertEquals($expectedFillable, $fillable);
    }
    
    /** @test */
    public function transaction_has_correct_casts()
    {
        $casts = $this->transaction->getCasts();
        
        $this->assertEquals('integer', $casts['inventory_id']);
        $this->assertEquals('integer', $casts['user_id']);
        $this->assertEquals('integer', $casts['quantity']);
        $this->assertEquals('integer', $casts['before_quantity']);
        $this->assertEquals('integer', $casts['after_quantity']);
        $this->assertEquals('json', $casts['metadata']);
        $this->assertEquals('datetime', $casts['created_at']);
        $this->assertEquals('datetime', $casts['updated_at']);
    }
    
    /** @test */
    public function transaction_constants_are_defined()
    {
        $this->assertEquals('addition', InventoryTransaction::TYPE_ADDITION);
        $this->assertEquals('reduction', InventoryTransaction::TYPE_REDUCTION);
        $this->assertEquals('adjustment', InventoryTransaction::TYPE_ADJUSTMENT);
        $this->assertEquals('transfer_in', InventoryTransaction::TYPE_TRANSFER_IN);
        $this->assertEquals('transfer_out', InventoryTransaction::TYPE_TRANSFER_OUT);
    }
    
    /** @test */
    public function transaction_stores_basic_information_correctly()
    {
        $this->assertEquals($this->inventory->id, $this->transaction->inventory_id);
        $this->assertEquals($this->user->id, $this->transaction->user_id);
        $this->assertEquals('addition', $this->transaction->type);
        $this->assertEquals(25, $this->transaction->quantity);
        $this->assertEquals(25, $this->transaction->before_quantity);
        $this->assertEquals(50, $this->transaction->after_quantity);
        $this->assertEquals('測試進貨', $this->transaction->notes);
    }
    
    /** @test */
    public function transaction_handles_metadata_correctly()
    {
        $metadata = $this->transaction->metadata;
        
        // metadata 可能是 JSON 字串，需要解碼
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true);
        }
        
        $this->assertIsArray($metadata);
        $this->assertEquals('ORD-001', $metadata['order_id']);
        
        // 測試更新 metadata
        $newMetadata = [
            'order_id' => 'ORD-002',
            'batch_number' => 'BATCH-001',
            'supplier' => 'Test Supplier'
        ];

        $this->transaction->update(['metadata' => json_encode($newMetadata)]);
        $this->transaction->refresh();
        
        $storedMetadata = $this->transaction->metadata;
        if (is_string($storedMetadata)) {
            $storedMetadata = json_decode($storedMetadata, true);
        }
        
        $this->assertEquals('ORD-002', $storedMetadata['order_id']);
        $this->assertEquals('BATCH-001', $storedMetadata['batch_number']);
        $this->assertEquals('Test Supplier', $storedMetadata['supplier']);
    }
    
    /** @test */
    public function transaction_can_have_null_metadata()
    {
        $transaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'reduction',
            'quantity' => -10,
            'before_quantity' => 50,
            'after_quantity' => 40,
            'notes' => '銷售出貨',
            'metadata' => null
        ]);
        
        $this->assertNull($transaction->metadata);
    }
    
    /** @test */
    public function transaction_can_have_null_notes()
    {
        $transaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'adjustment',
            'quantity' => 5,
            'before_quantity' => 45,
            'after_quantity' => 50,
            'notes' => null
        ]);
        
        $this->assertNull($transaction->notes);
    }
    
    /** @test */
    public function addition_transaction_has_positive_quantity()
    {
        $transaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'addition',
            'quantity' => 30,
            'before_quantity' => 20,
            'after_quantity' => 50
        ]);
        
        $this->assertEquals('addition', $transaction->type);
        $this->assertTrue($transaction->quantity > 0);
        $this->assertEquals(30, $transaction->quantity);
    }
    
    /** @test */
    public function reduction_transaction_has_negative_quantity()
    {
        $transaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'reduction',
            'quantity' => -15,
            'before_quantity' => 50,
            'after_quantity' => 35
        ]);
        
        $this->assertEquals('reduction', $transaction->type);
        $this->assertTrue($transaction->quantity < 0);
        $this->assertEquals(-15, $transaction->quantity);
    }
    
    /** @test */
    public function adjustment_transaction_can_be_positive_or_negative()
    {
        // 正向調整
        $positiveAdjustment = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'adjustment',
            'quantity' => 10,
            'before_quantity' => 40,
            'after_quantity' => 50
        ]);
        
        $this->assertEquals('adjustment', $positiveAdjustment->type);
        $this->assertTrue($positiveAdjustment->quantity > 0);
        
        // 負向調整
        $negativeAdjustment = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'adjustment',
            'quantity' => -20,
            'before_quantity' => 50,
            'after_quantity' => 30
        ]);
        
        $this->assertEquals('adjustment', $negativeAdjustment->type);
        $this->assertTrue($negativeAdjustment->quantity < 0);
    }
    
    /** @test */
    public function transfer_in_transaction_has_positive_quantity()
    {
        $transaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'transfer_in',
            'quantity' => 20,
            'before_quantity' => 30,
            'after_quantity' => 50,
            'metadata' => json_encode(['transfer_id' => 'TRF-001'])
        ]);
        
        $this->assertEquals('transfer_in', $transaction->type);
        $this->assertTrue($transaction->quantity > 0);
        
        $metadata = $transaction->metadata;
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true);
        }
        $this->assertEquals('TRF-001', $metadata['transfer_id']);
    }
    
    /** @test */
    public function transfer_out_transaction_has_negative_quantity()
    {
        $transaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'transfer_out',
            'quantity' => -25,
            'before_quantity' => 50,
            'after_quantity' => 25,
            'metadata' => json_encode(['transfer_id' => 'TRF-002'])
        ]);
        
        $this->assertEquals('transfer_out', $transaction->type);
        $this->assertTrue($transaction->quantity < 0);
        
        $metadata = $transaction->metadata;
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true);
        }
        $this->assertEquals('TRF-002', $metadata['transfer_id']);
    }
    
    /** @test */
    public function transfer_cancel_transaction_restores_quantity()
    {
        $transaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'transfer_cancel',
            'quantity' => 25,
            'before_quantity' => 25,
            'after_quantity' => 50,
            'notes' => '轉移取消，恢復庫存',
            'metadata' => json_encode(['transfer_id' => 'TRF-003'])
        ]);
        
        $this->assertEquals('transfer_cancel', $transaction->type);
        $this->assertTrue($transaction->quantity > 0);
        $this->assertEquals('轉移取消，恢復庫存', $transaction->notes);
        
        $metadata = $transaction->metadata;
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true);
        }
        $this->assertEquals('TRF-003', $metadata['transfer_id']);
    }
    
    /** @test */
    public function transaction_quantity_change_is_calculated_correctly()
    {
        // 測試增加庫存
        $this->assertEquals(25, $this->transaction->quantity);
        $this->assertEquals(50 - 25, $this->transaction->quantity); // after - before
        
        // 測試減少庫存
        $reductionTransaction = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'reduction',
            'quantity' => -15,
            'before_quantity' => 50,
            'after_quantity' => 35
        ]);
        
        $this->assertEquals(-15, $reductionTransaction->quantity);
        $this->assertEquals(35 - 50, $reductionTransaction->quantity); // after - before
    }
    
    /** @test */
    public function transactions_are_ordered_by_creation_time()
    {
        // 建立第一個交易記錄（較早的時間）
        $earlierTime = now()->subMinutes(10);
        $transaction1 = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'addition',
            'quantity' => 10,
            'before_quantity' => 50,
            'after_quantity' => 60,
        ]);
        $transaction1->update(['created_at' => $earlierTime]);
        
        // 小延遲確保時間不同
        sleep(1);
        
        // 建立第二個交易記錄（較晚的時間）
        $laterTime = now()->subMinutes(5);
        $transaction2 = InventoryTransaction::create([
            'inventory_id' => $this->inventory->id,
            'user_id' => $this->user->id,
            'type' => 'reduction',
            'quantity' => -5,
            'before_quantity' => 60,
            'after_quantity' => 55,
        ]);
        $transaction2->update(['created_at' => $laterTime]);
        
        // 重新查詢以確保獲得更新後的時間戳
        $transaction1->refresh();
        $transaction2->refresh();
        
        // 直接比較兩個記錄的時間
        $this->assertTrue($transaction1->created_at->lessThan($transaction2->created_at));
        
        // 按時間順序獲取這兩個特定的交易記錄
        $transactions = $this->inventory->transactions()
            ->whereIn('id', [$transaction1->id, $transaction2->id])
            ->orderBy('created_at')
            ->get();
        
        $this->assertEquals(2, $transactions->count());
        $this->assertEquals($transaction1->id, $transactions->first()->id);
        $this->assertEquals($transaction2->id, $transactions->last()->id);
    }
}
