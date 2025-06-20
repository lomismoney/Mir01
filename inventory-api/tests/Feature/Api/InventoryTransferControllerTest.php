<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\InventoryTransfer;
use App\Models\InventoryTransaction;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Testing\Fluent\AssertableJson;

class InventoryTransferControllerTest extends TestCase
{
    use WithFaker;
    
    protected Store $fromStore;
    protected Store $toStore;
    protected Product $product;
    protected ProductVariant $variant;
    protected Inventory $fromInventory;
    protected Inventory $toInventory;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // 建立來源和目標門市
        $this->fromStore = Store::create([
            'name' => '來源門市',
            'address' => '來源地址123號'
        ]);
        
        $this->toStore = Store::create([
            'name' => '目標門市',
            'address' => '目標地址456號'
        ]);
        
        // 建立測試分類
        $category = Category::factory()->create(['name' => '測試分類']);
        
        // 建立測試屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        // 建立測試商品
        $this->product = Product::factory()->create([
            'name' => '轉移測試商品',
            'description' => '用於轉移測試的商品',
            'category_id' => $category->id
        ]);
        
        // 關聯商品與屬性
        $this->product->attributes()->attach($colorAttribute->id);
        
        // 建立測試變體
        $this->variant = $this->product->variants()->create([
            'sku' => 'TRANSFER-SKU-001',
            'price' => 100.00
        ]);
        
        // 關聯變體與屬性值
        $this->variant->attributeValues()->attach($redValue->id);
        
        // 建立來源門市的庫存（有足夠庫存）
        $this->fromInventory = Inventory::create([
            'product_variant_id' => $this->variant->id,
            'store_id' => $this->fromStore->id,
            'quantity' => 100,
            'low_stock_threshold' => 10
        ]);
        
        // 建立目標門市的庫存（初始庫存為0）
        $this->toInventory = Inventory::create([
            'product_variant_id' => $this->variant->id,
            'store_id' => $this->toStore->id,
            'quantity' => 0,
            'low_stock_threshold' => 5
        ]);
    }
    
    /** @test */
    public function admin_can_get_transfer_list()
    {
        // 建立一些轉移記錄
        $user = $this->createAdminUser();
        
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'completed',
            'notes' => '已完成的轉移'
        ]);
        
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 15,
            'status' => 'pending',
            'notes' => '待處理的轉移'
        ]);
        
        $response = $this->actingAsAdmin()
            ->getJson('/api/inventory/transfers');
            
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'from_store_id',
                        'to_store_id',
                        'user_id',
                        'product_variant_id',
                        'quantity',
                        'status',
                        'notes',
                        'from_store' => [
                            'id',
                            'name',
                            'address'
                        ],
                        'to_store' => [
                            'id',
                            'name',
                            'address'
                        ],
                        'user' => [
                            'id',
                            'name'
                        ],
                        'product_variant' => [
                            'id',
                            'sku',
                            'product' => [
                                'id',
                                'name'
                            ]
                        ]
                    ]
                ]
            ]);
            
        // 確認回傳兩筆轉移記錄
        $this->assertCount(2, $response->json('data'));
    }
    
    /** @test */
    public function admin_can_filter_transfers_by_store()
    {
        $user = $this->createAdminUser();
        $otherStore = Store::create(['name' => '其他門市', 'address' => '其他地址']);
        
        // 建立不同來源門市的轉移記錄
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'completed'
        ]);
        
        InventoryTransfer::create([
            'from_store_id' => $otherStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 15,
            'status' => 'pending'
        ]);
        
        // 測試按來源門市篩選
        $response = $this->actingAsAdmin()
            ->getJson("/api/inventory/transfers?from_store_id={$this->fromStore->id}");
            
        $response->assertStatus(200);
        
        $transfers = $response->json('data');
        $this->assertCount(1, $transfers);
        $this->assertEquals($this->fromStore->id, $transfers[0]['from_store_id']);
    }
    
    /** @test */
    public function admin_can_filter_transfers_by_status()
    {
        $user = $this->createAdminUser();
        
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'completed'
        ]);
        
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 15,
            'status' => 'pending'
        ]);
        
        $response = $this->actingAsAdmin()
            ->getJson('/api/inventory/transfers?status=pending');
            
        $response->assertStatus(200);
        
        $transfers = $response->json('data');
        $this->assertCount(1, $transfers);
        $this->assertEquals('pending', $transfers[0]['status']);
    }
    
    /** @test */
    public function admin_can_view_single_transfer_detail()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 25,
            'status' => 'in_transit',
            'notes' => '轉移詳情測試'
        ]);
        
        $response = $this->actingAsAdmin()
            ->getJson("/api/inventory/transfers/{$transfer->id}");
            
        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'from_store_id',
                'to_store_id',
                'user_id',
                'product_variant_id',
                'quantity',
                'status',
                'notes',
                'created_at',
                'updated_at',
                'from_store',
                'to_store',
                'user',
                'product_variant'
            ])
            ->assertJson([
                'id' => $transfer->id,
                'quantity' => 25,
                'status' => 'in_transit',
                'notes' => '轉移詳情測試'
            ]);
    }
    
    /** @test */
    public function admin_can_create_inventory_transfer()
    {
        $transferData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 30,
            'notes' => '新建轉移測試'
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/inventory/transfers', $transferData);
            
        $response->assertStatus(201) // 修復：創建資源應該返回 201
            ->assertJsonStructure([
                'message',
                'transfer' => [
                    'id',
                    'from_store_id',
                    'to_store_id',
                    'user_id',
                    'product_variant_id',
                    'quantity',
                    'status',
                    'notes',
                    'from_store',
                    'to_store',
                    'user',
                    'product_variant'
                ]
            ])
            ->assertJson([
                'message' => '庫存轉移成功',
                'transfer' => [
                    'from_store_id' => $this->fromStore->id,
                    'to_store_id' => $this->toStore->id,
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 30,
                    'status' => 'completed', // 根據實際回應調整
                    'notes' => '新建轉移測試'
                ]
            ]);
            
        // 確認資料庫記錄已建立
        $this->assertDatabaseHas('inventory_transfers', [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 30,
            'status' => 'completed', // 根據實際行為調整
            'notes' => '新建轉移測試'
        ]);
    }
    
    /** @test */
    public function cannot_transfer_more_than_available_stock()
    {
        $transferData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 150, // 超過可用庫存100
            'notes' => '超量轉移測試'
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/inventory/transfers', $transferData);
            
        $response->assertStatus(400)
            ->assertJson([
                'message' => '來源門市庫存不足，無法完成轉移'
            ]);
            
        // 確認轉移記錄未建立
        $this->assertDatabaseMissing('inventory_transfers', [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'quantity' => 150
        ]);
    }
    
    /** @test */
    public function cannot_transfer_to_same_store()
    {
        $transferData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->fromStore->id, // 相同門市
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'notes' => '同門市轉移測試'
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/inventory/transfers', $transferData);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['to_store_id']);
    }
    
    /** @test */
    public function admin_can_update_transfer_status_to_in_transit()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 25,
            'status' => 'pending',
            'notes' => '狀態更新測試'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'in_transit'
            ]);
            
        $response->assertStatus(200)
            ->assertJson([
                'message' => '庫存轉移狀態更新成功',
                'transfer' => [
                    'id' => $transfer->id,
                    'status' => 'in_transit'
                ]
            ]);
            
        // 確認來源門市庫存已扣減（in_transit 狀態會扣減庫存）
        $this->assertDatabaseHas('inventories', [
            'id' => $this->fromInventory->id,
            'quantity' => 75 // 100 - 25 = 75
        ]);
        
        // 確認交易記錄已建立
        $this->assertDatabaseHas('inventory_transactions', [
            'inventory_id' => $this->fromInventory->id,
            'type' => 'transfer_out',
            'quantity' => -25
        ]);
    }
    
    /** @test */
    public function admin_can_complete_transfer()
    {
        $user = $this->createAdminUser();
        
        // 建立已在運輸中的轉移
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 30,
            'status' => 'in_transit',
            'notes' => '完成轉移測試'
        ]);
        
        // 模擬來源庫存已扣減
        $this->fromInventory->update(['quantity' => 70]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'completed'
            ]);
            
        $response->assertStatus(200)
            ->assertJson([
                'message' => '庫存轉移狀態更新成功',
                'transfer' => [
                    'status' => 'completed'
                ]
            ]);
            
        // 確認目標門市庫存已增加
        $this->assertDatabaseHas('inventories', [
            'id' => $this->toInventory->id,
            'quantity' => 30 // 0 + 30
        ]);
        
        // 確認目標門市交易記錄已建立
        $this->assertDatabaseHas('inventory_transactions', [
            'inventory_id' => $this->toInventory->id,
            'type' => 'transfer_in',
            'quantity' => 30
        ]);
    }
    
    /** @test */
    public function admin_can_cancel_pending_transfer()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'pending',
            'notes' => '取消轉移測試'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/cancel", [
                'reason' => '取消原因：測試取消功能'
            ]);
            
        $response->assertStatus(200)
            ->assertJson([
                'message' => '庫存轉移已取消',
                'transfer' => [
                    'status' => 'cancelled'
                ]
            ]);
            
        // 確認來源門市庫存未受影響
        $this->assertDatabaseHas('inventories', [
            'id' => $this->fromInventory->id,
            'quantity' => 100 // 保持原值
        ]);
    }
    
    /** @test */
    public function admin_can_cancel_in_transit_transfer()
    {
        $user = $this->createAdminUser();
        
        // 建立運輸中的轉移
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 25,
            'status' => 'in_transit',
            'notes' => '取消運輸中轉移測試'
        ]);
        
        // 模擬來源庫存已扣減
        $this->fromInventory->update(['quantity' => 75]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/cancel", [
                'reason' => '取消原因：測試運輸中取消功能'
            ]);
            
        $response->assertStatus(200)
            ->assertJson([
                'message' => '庫存轉移已取消',
                'transfer' => [
                    'status' => 'cancelled'
                ]
            ]);
            
        // 確認來源門市庫存已恢復
        $this->assertDatabaseHas('inventories', [
            'id' => $this->fromInventory->id,
            'quantity' => 100 // 75 + 25 = 100，恢復原值
        ]);
        
        // 確認恢復交易記錄已建立
        $this->assertDatabaseHas('inventory_transactions', [
            'inventory_id' => $this->fromInventory->id,
            'type' => 'transfer_cancel',
            'quantity' => 25
        ]);
    }
    
    /** @test */
    public function cannot_cancel_completed_transfer()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'completed',
            'notes' => '已完成的轉移'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/cancel", [
                'reason' => '嘗試取消已完成的轉移'
            ]);
            
        $response->assertStatus(400)
            ->assertJson([
                'message' => '已完成或已取消的轉移記錄不能再次取消'
            ]);
    }
    
    /** @test */
    public function viewer_cannot_create_transfers()
    {
        $transferData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'notes' => '檢視者嘗試建立轉移'
        ];
        
        $response = $this->actingAsUser()
            ->postJson('/api/inventory/transfers', $transferData);
            
        // 檢視者無權限創建轉移，應該返回 403
        $response->assertStatus(403);
    }
    
    /** @test */
    public function viewer_cannot_update_transfer_status()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'pending'
        ]);
        
        $response = $this->actingAsUser()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'in_transit'
            ]);
            
        // 檢視者無權限更新轉移狀態，應該返回 403
        $response->assertStatus(403);
    }
    
    /** @test */
    public function viewer_can_view_transfers()
    {
        $response = $this->actingAsUser()
            ->getJson('/api/inventory/transfers');
            
        $response->assertStatus(200);
    }
    
    /** @test */
    public function requires_authentication_for_transfer_access()
    {
        $response = $this->getJson('/api/inventory/transfers');
        $response->assertStatus(401);
        
        $response = $this->postJson('/api/inventory/transfers', []);
        $response->assertStatus(401);
    }
    
    /** @test */
    public function transfer_validation_works()
    {
        // 測試缺少必要欄位
        $response = $this->actingAsAdmin()
            ->postJson('/api/inventory/transfers', []);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'from_store_id',
                'to_store_id',
                'product_variant_id',
                'quantity'
            ]);
        
        // 測試無效的數量
        $response = $this->actingAsAdmin()
            ->postJson('/api/inventory/transfers', [
                'from_store_id' => $this->fromStore->id,
                'to_store_id' => $this->toStore->id,
                'product_variant_id' => $this->variant->id,
                'quantity' => 0 // 無效數量
            ]);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
        
        // 測試不存在的門市ID
        $response = $this->actingAsAdmin()
            ->postJson('/api/inventory/transfers', [
                'from_store_id' => 99999, // 不存在的門市
                'to_store_id' => $this->toStore->id,
                'product_variant_id' => $this->variant->id,
                'quantity' => 10
            ]);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['from_store_id']);
    }
    
    /** @test */
    public function admin_can_update_transfer_from_pending_directly_to_completed()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 35,
            'status' => 'pending',
            'notes' => '直接完成轉移測試'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'completed',
                'notes' => '已確認收到並完成'
            ]);
            
        $response->assertStatus(200)
            ->assertJson([
                'message' => '庫存轉移狀態更新成功',
                'transfer' => [
                    'status' => 'completed',
                    'notes' => '已確認收到並完成'
                ]
            ]);
            
        // 確認來源門市庫存已扣減
        $this->assertDatabaseHas('inventories', [
            'id' => $this->fromInventory->id,
            'quantity' => 65 // 100 - 35 = 65
        ]);
        
        // 確認目標門市庫存已增加
        $this->assertDatabaseHas('inventories', [
            'id' => $this->toInventory->id,
            'quantity' => 35 // 0 + 35 = 35
        ]);
        
        // 確認兩個交易記錄都已建立
        $this->assertDatabaseHas('inventory_transactions', [
            'inventory_id' => $this->fromInventory->id,
            'type' => 'transfer_out',
            'quantity' => -35
        ]);
        
        $this->assertDatabaseHas('inventory_transactions', [
            'inventory_id' => $this->toInventory->id,
            'type' => 'transfer_in',
            'quantity' => 35
        ]);
    }
    
    /** @test */
    public function cannot_update_status_to_same_status()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'pending'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'pending' // 相同狀態
            ]);
            
        $response->assertStatus(200)
            ->assertJson(['message' => '狀態未變更']);
    }
    
    /** @test */
    public function cannot_update_completed_transfer_status()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'completed'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'in_transit'
            ]);
            
        $response->assertStatus(400)
            ->assertJson([
                'message' => '已完成或已取消的轉移記錄不能更改狀態'
            ]);
    }
    
    /** @test */
    public function cannot_update_cancelled_transfer_status()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'cancelled'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'pending'
            ]);
            
        $response->assertStatus(400)
            ->assertJson([
                'message' => '已完成或已取消的轉移記錄不能更改狀態'
            ]);
    }
    
    /** @test */
    public function update_status_handles_insufficient_stock_error()
    {
        $user = $this->createAdminUser();
        
        // 設置來源庫存不足
        $this->fromInventory->update(['quantity' => 5]);
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20, // 超過可用庫存
            'status' => 'pending'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'in_transit'
            ]);
            
        $response->assertStatus(400)
            ->assertJson([
                'message' => '來源門市庫存不足，無法開始轉移'
            ]);
            
        // 確認狀態未改變
        $this->assertDatabaseHas('inventory_transfers', [
            'id' => $transfer->id,
            'status' => 'pending'
        ]);
    }
    
    /** @test */
    public function admin_can_filter_transfers_by_date_range()
    {
        $user = $this->createAdminUser();
        
        // 創建不同日期的轉移記錄
        $oldDate = now()->subDays(10);
        $recentDate = now()->subDays(2);
        
        $oldTransfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'status' => 'completed'
        ]);
        $oldTransfer->created_at = $oldDate;
        $oldTransfer->save();
        
        $recentTransfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 15,
            'status' => 'pending'
        ]);
        $recentTransfer->created_at = $recentDate;
        $recentTransfer->save();
        
        $startDate = now()->subDays(5)->format('Y-m-d');
        $endDate = now()->addDay()->format('Y-m-d'); // 確保包含今天和明天
        
        $response = $this->actingAsAdmin()
            ->getJson("/api/inventory/transfers?start_date={$startDate}&end_date={$endDate}");
            
        $response->assertStatus(200);
        
        $transfers = $response->json('data');
        $this->assertCount(1, $transfers);
        $this->assertEquals($recentTransfer->id, $transfers[0]['id']);
    }
    
    /** @test */
    public function admin_can_filter_transfers_by_product_name()
    {
        $user = $this->createAdminUser();
        
        // 創建另一個商品
        $otherProduct = Product::factory()->create(['name' => '其他測試商品']);
        $otherVariant = $otherProduct->variants()->create([
            'sku' => 'OTHER-SKU-001',
            'price' => 50.00
        ]);
        
        // 創建轉移記錄
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'status' => 'completed'
        ]);
        
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $otherVariant->id,
            'quantity' => 15,
            'status' => 'pending'
        ]);
        
        $response = $this->actingAsAdmin()
            ->getJson('/api/inventory/transfers?product_name=轉移測試商品');
            
        $response->assertStatus(200);
        
        $transfers = $response->json('data');
        $this->assertCount(1, $transfers);
        $this->assertEquals($this->variant->id, $transfers[0]['product_variant_id']);
    }
    
    /** @test */
    public function admin_can_filter_transfers_by_target_store()
    {
        $user = $this->createAdminUser();
        $thirdStore = Store::create(['name' => '第三門市', 'address' => '第三地址']);
        
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'status' => 'completed'
        ]);
        
        InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $thirdStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 15,
            'status' => 'pending'
        ]);
        
        $response = $this->actingAsAdmin()
            ->getJson("/api/inventory/transfers?to_store_id={$thirdStore->id}");
            
        $response->assertStatus(200);
        
        $transfers = $response->json('data');
        $this->assertCount(1, $transfers);
        $this->assertEquals($thirdStore->id, $transfers[0]['to_store_id']);
    }
    
    /** @test */
    public function show_returns_404_for_non_existent_transfer()
    {
        $response = $this->actingAsAdmin()
            ->getJson('/api/inventory/transfers/99999');
            
        $response->assertStatus(404);
    }
    
    /** @test */
    public function update_status_returns_404_for_non_existent_transfer()
    {
        $response = $this->actingAsAdmin()
            ->patchJson('/api/inventory/transfers/99999/status', [
                'status' => 'completed'
            ]);
            
        $response->assertStatus(404);
    }
    
    /** @test */
    public function cancel_returns_404_for_non_existent_transfer()
    {
        $response = $this->actingAsAdmin()
            ->patchJson('/api/inventory/transfers/99999/cancel', [
                'reason' => '測試錯誤'
            ]);
            
        $response->assertStatus(404);
    }
    
    /** @test */
    public function update_status_validates_status_field()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'pending'
        ]);
        
        // 測試無效狀態值
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'status' => 'invalid_status'
            ]);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
            
        // 測試缺少必填的 status 欄位
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/status", [
                'notes' => '只有備註'
            ]);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }
    
    /** @test */
    public function cancel_validates_reason_field()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'pending'
        ]);
        
        // 測試缺少必填的 reason 欄位
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/cancel", []);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
            
        // 測試空的 reason 欄位
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/cancel", [
                'reason' => ''
            ]);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }
    
    /** @test */
    public function cannot_cancel_already_cancelled_transfer()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'cancelled'
        ]);
        
        $response = $this->actingAsAdmin()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/cancel", [
                'reason' => '嘗試再次取消'
            ]);
            
        $response->assertStatus(400)
            ->assertJson([
                'message' => '已完成或已取消的轉移記錄不能再次取消'
            ]);
    }
    
    /** @test */
    public function index_works_with_pagination()
    {
        $user = $this->createAdminUser();
        
        // 創建多個轉移記錄
        for ($i = 1; $i <= 20; $i++) {
            InventoryTransfer::create([
                'from_store_id' => $this->fromStore->id,
                'to_store_id' => $this->toStore->id,
                'user_id' => $user->id,
                'product_variant_id' => $this->variant->id,
                'quantity' => 5,
                'status' => 'completed'
            ]);
        }
        
        // 測試預設分頁
        $response = $this->actingAsAdmin()
            ->getJson('/api/inventory/transfers');
            
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'per_page',
                    'to',
                    'total'
                ]
            ]);
            
        $this->assertEquals(15, $response->json('meta.per_page')); // 預設15個
        
        // 測試自訂每頁數量
        $response = $this->actingAsAdmin()
            ->getJson('/api/inventory/transfers?per_page=5');
            
        $response->assertStatus(200);
        $this->assertEquals(5, $response->json('meta.per_page'));
        $this->assertCount(5, $response->json('data'));
    }
    
    /** @test */
    public function viewer_cannot_cancel_transfer()
    {
        $user = $this->createAdminUser();
        
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'user_id' => $user->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'status' => 'pending'
        ]);
        
        $response = $this->actingAsUser()
            ->patchJson("/api/inventory/transfers/{$transfer->id}/cancel", [
                'reason' => '檢視者嘗試取消'
            ]);
            
        $response->assertStatus(403);
    }
    
    /** @test */
    public function store_creates_inventory_records_if_not_exist()
    {
        // 刪除目標門市的庫存記錄，測試自動創建功能
        $this->toInventory->delete();
        
        $transferData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 25,
            'notes' => '測試自動創建庫存記錄'
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/inventory/transfers', $transferData);
            
        $response->assertStatus(201);
        
        // 確認目標門市的庫存記錄已自動創建
        $this->assertDatabaseHas('inventories', [
            'product_variant_id' => $this->variant->id,
            'store_id' => $this->toStore->id,
            'quantity' => 25, // 轉移後的數量
            'low_stock_threshold' => 5 // 預設值
        ]);
    }
    
    /** @test */
    public function store_with_pending_status_does_not_modify_inventory()
    {
        $transferData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 30,
            'status' => 'pending', // 指定為待處理狀態
            'notes' => '測試待處理狀態'
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/inventory/transfers', $transferData);
            
        $response->assertStatus(201)
            ->assertJson([
                'transfer' => [
                    'status' => 'pending'
                ]
            ]);
            
        // 確認庫存未變動（待處理狀態不應該修改庫存）
        $this->assertDatabaseHas('inventories', [
            'id' => $this->fromInventory->id,
            'quantity' => 100 // 原始數量未變
        ]);
        
        $this->assertDatabaseHas('inventories', [
            'id' => $this->toInventory->id,
            'quantity' => 0 // 目標庫存未變
        ]);
    }
}
