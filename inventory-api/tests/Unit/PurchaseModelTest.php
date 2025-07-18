<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Purchase;
use App\Models\Store;
use App\Models\User;
use App\Models\PurchaseItem;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Purchase Model 單元測試
 * 
 * 測試進貨單模型的所有功能，包括：
 * - 關聯關係
 * - 狀態管理
 * - 金額轉換
 * - 業務邏輯方法
 */
class PurchaseModelTest extends TestCase
{
    use RefreshDatabase;
    
    /**
     * 測試進貨單屬於門市的關聯
     */
    public function test_purchase_belongs_to_store()
    {
        $store = Store::factory()->create();
        $purchase = Purchase::factory()->create([
            'store_id' => $store->id
        ]);
        
        $this->assertInstanceOf(Store::class, $purchase->store);
        $this->assertEquals($store->id, $purchase->store->id);
    }
    
    /**
     * 測試進貨單屬於用戶的關聯
     */
    public function test_purchase_belongs_to_user()
    {
        $user = User::factory()->create();
        $purchase = Purchase::factory()->create([
            'user_id' => $user->id
        ]);
        
        $this->assertInstanceOf(User::class, $purchase->user);
        $this->assertEquals($user->id, $purchase->user->id);
    }
    
    /**
     * 測試進貨單有多個項目的關聯
     */
    public function test_purchase_has_many_items()
    {
        $purchase = Purchase::factory()->create();
        $items = PurchaseItem::factory()->count(5)->create([
            'purchase_id' => $purchase->id
        ]);
        
        $this->assertCount(5, $purchase->items);
        $this->assertInstanceOf(PurchaseItem::class, $purchase->items->first());
    }
    
    /**
     * 測試所有狀態常數定義正確
     */
    public function test_status_constants_are_defined()
    {
        $this->assertEquals('pending', Purchase::STATUS_PENDING);
        $this->assertEquals('confirmed', Purchase::STATUS_CONFIRMED);
        $this->assertEquals('in_transit', Purchase::STATUS_IN_TRANSIT);
        $this->assertEquals('received', Purchase::STATUS_RECEIVED);
        $this->assertEquals('completed', Purchase::STATUS_COMPLETED);
        $this->assertEquals('cancelled', Purchase::STATUS_CANCELLED);
        $this->assertEquals('partially_received', Purchase::STATUS_PARTIALLY_RECEIVED);
    }
    
    /**
     * 測試獲取狀態選項
     */
    public function test_get_status_options()
    {
        $options = Purchase::getStatusOptions();
        
        $this->assertIsArray($options);
        $this->assertArrayHasKey('pending', $options);
        $this->assertArrayHasKey('confirmed', $options);
        $this->assertArrayHasKey('in_transit', $options);
        $this->assertArrayHasKey('received', $options);
        $this->assertArrayHasKey('completed', $options);
        $this->assertArrayHasKey('cancelled', $options);
        $this->assertArrayHasKey('partially_received', $options);
        
        $this->assertEquals('已下單', $options['pending']);
        $this->assertEquals('已確認', $options['confirmed']);
        $this->assertEquals('運輸中', $options['in_transit']);
        $this->assertEquals('已收貨', $options['received']);
        $this->assertEquals('已完成', $options['completed']);
        $this->assertEquals('已取消', $options['cancelled']);
        $this->assertEquals('部分收貨', $options['partially_received']);
    }
    
    /**
     * 測試狀態描述屬性
     */
    public function test_status_description_attribute()
    {
        $purchase = Purchase::factory()->create(['status' => 'pending']);
        $this->assertEquals('已下單', $purchase->status_description);
        
        $purchase->status = 'completed';
        $this->assertEquals('已完成', $purchase->status_description);
        
        // 測試未知狀態
        $purchase->status = 'invalid_status';
        $this->assertEquals('未知狀態', $purchase->status_description);
    }
    
    /**
     * 測試可以取消的狀態
     */
    public function test_can_be_cancelled()
    {
        // 可以取消的狀態
        $cancellableStatuses = ['pending', 'confirmed', 'in_transit'];
        foreach ($cancellableStatuses as $status) {
            $purchase = Purchase::factory()->create(['status' => $status]);
            $this->assertTrue($purchase->canBeCancelled(), "狀態 {$status} 應該可以取消");
        }
        
        // 不能取消的狀態
        $nonCancellableStatuses = ['received', 'completed', 'cancelled', 'partially_received'];
        foreach ($nonCancellableStatuses as $status) {
            $purchase = Purchase::factory()->create(['status' => $status]);
            $this->assertFalse($purchase->canBeCancelled(), "狀態 {$status} 不應該可以取消");
        }
    }
    
    /**
     * 測試可以修改的狀態
     */
    public function test_can_be_modified()
    {
        // 可以修改的狀態
        $modifiableStatuses = ['pending', 'confirmed', 'received', 'partially_received'];
        foreach ($modifiableStatuses as $status) {
            $purchase = Purchase::factory()->create(['status' => $status]);
            $this->assertTrue($purchase->canBeModified(), "狀態 {$status} 應該可以修改");
        }
        
        // 不能修改的狀態
        $nonModifiableStatuses = ['in_transit', 'completed', 'cancelled'];
        foreach ($nonModifiableStatuses as $status) {
            $purchase = Purchase::factory()->create(['status' => $status]);
            $this->assertFalse($purchase->canBeModified(), "狀態 {$status} 不應該可以修改");
        }
    }
    
    /**
     * 測試是否已完成
     */
    public function test_is_completed()
    {
        $purchase = Purchase::factory()->create(['status' => 'completed']);
        $this->assertTrue($purchase->isCompleted());
        
        $allStatuses = ['pending', 'confirmed', 'in_transit', 'received', 'cancelled', 'partially_received'];
        foreach ($allStatuses as $status) {
            $purchase->status = $status;
            $this->assertFalse($purchase->isCompleted());
        }
    }
    
    /**
     * 測試可以進行入庫操作的狀態
     */
    public function test_can_receive_stock()
    {
        // 可以入庫的狀態
        $receivableStatuses = ['received', 'partially_received'];
        foreach ($receivableStatuses as $status) {
            $purchase = Purchase::factory()->create(['status' => $status]);
            $this->assertTrue($purchase->canReceiveStock(), "狀態 {$status} 應該可以入庫");
        }
        
        // 不能入庫的狀態
        $nonReceivableStatuses = ['pending', 'confirmed', 'in_transit', 'completed', 'cancelled'];
        foreach ($nonReceivableStatuses as $status) {
            $purchase = Purchase::factory()->create(['status' => $status]);
            $this->assertFalse($purchase->canReceiveStock(), "狀態 {$status} 不應該可以入庫");
        }
    }
    
    /**
     * 測試總金額的取值器（分轉元）
     */
    public function test_total_amount_accessor()
    {
        // 資料庫儲存 123456 分
        $purchase = Purchase::factory()->create([
            'total_amount' => 123456
        ]);
        
        // 重新載入以確保從資料庫讀取
        $purchase->refresh();
        
        // 應該回傳 1235 元（四捨五入）
        $this->assertEquals(1235, $purchase->total_amount);
        
        // 測試四捨五入
        $purchase->setRawAttributes(['total_amount' => 123449]); // 1234.49 應該捨去為 1234
        $this->assertEquals(1234, $purchase->total_amount);
        
        $purchase->setRawAttributes(['total_amount' => 123450]); // 1234.50 應該進位為 1235
        $this->assertEquals(1235, $purchase->total_amount);
    }
    
    /**
     * 測試運費的取值器（分轉元）
     */
    public function test_shipping_cost_accessor()
    {
        // 資料庫儲存 5000 分
        $purchase = Purchase::factory()->create([
            'shipping_cost' => 5000
        ]);
        
        // 重新載入以確保從資料庫讀取
        $purchase->refresh();
        
        // 應該回傳 50 元
        $this->assertEquals(50, $purchase->shipping_cost);
        
        // 測試零運費
        $purchase->setRawAttributes(['shipping_cost' => 0]);
        $this->assertEquals(0, $purchase->shipping_cost);
    }
    
    /**
     * 測試正確的屬性轉型
     */
    public function test_purchase_has_correct_casts()
    {
        $purchase = new Purchase();
        $casts = $purchase->getCasts();
        
        $this->assertEquals('integer', $casts['total_amount']);
        $this->assertEquals('integer', $casts['shipping_cost']);
        $this->assertEquals('datetime', $casts['purchased_at']);
        $this->assertEquals('datetime', $casts['created_at']);
        $this->assertEquals('datetime', $casts['updated_at']);
    }
    
    /**
     * 測試進貨單可以被批量賦值創建
     */
    public function test_purchase_can_be_created_with_mass_assignment()
    {
        $store = Store::factory()->create();
        $user = User::factory()->create();
        $purchasedAt = Carbon::now();
        
        $data = [
            'store_id' => $store->id,
            'user_id' => $user->id,
            'order_number' => 'PO-20250709001',
            'total_amount' => 500000, // 5000元
            'shipping_cost' => 10000, // 100元
            'status' => 'pending',
            'purchased_at' => $purchasedAt,
            'notes' => '測試進貨單',
        ];
        
        $purchase = Purchase::create($data);
        
        $this->assertDatabaseHas('purchases', [
            'order_number' => 'PO-20250709001',
            'store_id' => $store->id,
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        
        // 驗證金額（注意 accessor 會轉換）
        $this->assertEquals(5000, $purchase->total_amount);
        $this->assertEquals(100, $purchase->shipping_cost);
    }
    
    /**
     * 測試進貨單使用 HasFactory trait
     */
    public function test_purchase_uses_has_factory_trait()
    {
        $purchase = Purchase::factory()->make();
        $this->assertInstanceOf(Purchase::class, $purchase);
    }
    
    /**
     * 測試日期欄位
     */
    public function test_purchase_date_fields()
    {
        $purchasedAt = Carbon::create(2025, 7, 9, 10, 30, 0);
        
        $purchase = Purchase::factory()->create([
            'purchased_at' => $purchasedAt
        ]);
        
        $this->assertInstanceOf(Carbon::class, $purchase->purchased_at);
        $this->assertEquals($purchasedAt->toDateTimeString(), $purchase->purchased_at->toDateTimeString());
    }
    
    /**
     * 測試進貨單編號的唯一性
     */
    public function test_order_number_is_unique()
    {
        $purchase1 = Purchase::factory()->create(['order_number' => 'PO-UNIQUE-001']);
        
        // 嘗試創建相同編號的進貨單應該失敗
        $this->expectException(\Illuminate\Database\QueryException::class);
        Purchase::factory()->create(['order_number' => 'PO-UNIQUE-001']);
    }
    
    /**
     * 測試複雜的業務場景：進貨單狀態流轉
     */
    public function test_purchase_status_workflow()
    {
        $purchase = Purchase::factory()->create(['status' => 'pending']);
        
        // pending -> confirmed
        $this->assertTrue($purchase->canBeModified());
        $this->assertTrue($purchase->canBeCancelled());
        $this->assertFalse($purchase->canReceiveStock());
        
        // confirmed -> in_transit
        $purchase->status = 'in_transit';
        $this->assertFalse($purchase->canBeModified());
        $this->assertTrue($purchase->canBeCancelled());
        $this->assertFalse($purchase->canReceiveStock());
        
        // in_transit -> received
        $purchase->status = 'received';
        $this->assertTrue($purchase->canBeModified());
        $this->assertFalse($purchase->canBeCancelled());
        $this->assertTrue($purchase->canReceiveStock());
        
        // received -> completed
        $purchase->status = 'completed';
        $this->assertFalse($purchase->canBeModified());
        $this->assertFalse($purchase->canBeCancelled());
        $this->assertFalse($purchase->canReceiveStock());
        $this->assertTrue($purchase->isCompleted());
    }
}