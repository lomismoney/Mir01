<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\Store;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Testing\Fluent\AssertableJson;

class StoreControllerTest extends TestCase
{
    use WithFaker;
    
    /** @test */
    public function admin_can_get_all_stores()
    {
        // 手動創建商店，而不使用 factory
        $stores = [];
        for ($i = 0; $i < 3; $i++) {
            $stores[] = Store::create([
                'name' => 'Store ' . ($i + 1),
                'address' => 'Address ' . ($i + 1)
            ]);
        }
        
        // 以管理員身份訪問 API
        $response = $this->actingAsAdmin()
            ->getJson('/api/stores');
            
        // 檢查響應
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'address', 'created_at', 'updated_at']
                ]
            ]);
            
        // 確認數據庫中有三家店舖
        $this->assertCount(3, $response->json('data'));
    }
    
    /** @test */
    public function admin_can_create_store()
    {
        $storeData = [
            'name' => 'New Test Store',
            'address' => 'Test Address 123'
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/stores', $storeData);
            
        $response->assertStatus(201)
            ->assertJson(function (AssertableJson $json) use ($storeData) {
                $json->has('data')
                    ->where('data.name', $storeData['name'])
                    ->where('data.address', $storeData['address'])
                    ->etc();
            });
            
        $this->assertDatabaseHas('stores', $storeData);
    }
    
    /** @test */
    public function admin_can_show_store_details()
    {
        $store = Store::create([
            'name' => 'Store to View',
            'address' => 'Address to View'
        ]);
        
        $response = $this->actingAsAdmin()
            ->getJson("/api/stores/{$store->id}");
            
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($store) {
                $json->has('data')
                    ->where('data.id', $store->id)
                    ->where('data.name', $store->name)
                    ->where('data.address', $store->address)
                    ->etc();
            });
    }
    
    /** @test */
    public function admin_can_update_store()
    {
        $store = Store::create([
            'name' => 'Store to Update',
            'address' => 'Address to Update'
        ]);
        
        $updatedData = [
            'name' => 'Updated Store Name',
            'address' => 'Updated Address'
        ];
        
        $response = $this->actingAsAdmin()
            ->putJson("/api/stores/{$store->id}", $updatedData);
            
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($updatedData) {
                $json->has('data')
                    ->where('data.name', $updatedData['name'])
                    ->where('data.address', $updatedData['address'])
                    ->etc();
            });
            
        $this->assertDatabaseHas('stores', [
            'id' => $store->id,
            'name' => $updatedData['name'],
            'address' => $updatedData['address']
        ]);
    }
    
    /** @test */
    public function admin_can_delete_store()
    {
        $store = Store::create([
            'name' => 'Store to Delete',
            'address' => 'Address to Delete'
        ]);
        
        $response = $this->actingAsAdmin()
            ->deleteJson("/api/stores/{$store->id}");
            
        $response->assertStatus(204);
        
        $this->assertDatabaseMissing('stores', [
            'id' => $store->id
        ]);
    }
    
    /** @test */
    public function staff_cannot_create_store()
    {
        $storeData = [
            'name' => 'Store by Staff',
            'address' => 'Address by Staff'
        ];
        
        $response = $this->actingAsUser()
            ->postJson('/api/stores', $storeData);
            
        $response->assertStatus(403);
        
        $this->assertDatabaseMissing('stores', $storeData);
    }
    
    /** @test */
    public function staff_cannot_update_store()
    {
        $store = Store::create([
            'name' => 'Store not for Staff',
            'address' => 'Address not for Staff'
        ]);
        
        $updatedData = [
            'name' => 'Staff Updated Name',
            'address' => 'Staff Updated Address'
        ];
        
        $response = $this->actingAsUser()
            ->putJson("/api/stores/{$store->id}", $updatedData);
            
        $response->assertStatus(403);
        
        $this->assertDatabaseHas('stores', [
            'id' => $store->id,
            'name' => $store->name,
            'address' => $store->address
        ]);
    }
    
    /** @test */
    public function staff_cannot_delete_store()
    {
        $store = Store::create([
            'name' => 'Store not to Delete',
            'address' => 'Address not to Delete'
        ]);
        
        $response = $this->actingAsUser()
            ->deleteJson("/api/stores/{$store->id}");
            
        $response->assertStatus(403);
        
        $this->assertDatabaseHas('stores', [
            'id' => $store->id
        ]);
    }
} 