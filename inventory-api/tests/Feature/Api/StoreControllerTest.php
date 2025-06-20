<?php

namespace Tests\Feature\Api;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Testing\Fluent\AssertableJson;
use Tests\TestCase;
use App\Models\Inventory;

class StoreControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $admin;
    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $this->staff = User::factory()->create(['role' => 'staff']); // Assuming 'staff' is a valid role for these checks
    }

    /** @test */
    public function admin_can_get_all_stores()
    {
        Store::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/stores');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'address', 'created_at', 'updated_at']
                ]
            ])
            ->assertJsonCount(3, 'data');
    }

    /** @test */
    public function admin_can_create_store()
    {
        $storeData = [
            'name' => 'New Test Store',
            'address' => 'Test Address 123'
        ];

        $response = $this->actingAs($this->admin)
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
        $store = Store::factory()->create();

        $response = $this->actingAs($this->admin)
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
        $store = Store::factory()->create();

        $updatedData = [
            'name' => 'Updated Store Name',
            'address' => 'Updated Address'
        ];

        $response = $this->actingAs($this->admin)
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
        $store = Store::factory()->create();

        $response = $this->actingAs($this->admin)
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

        $response = $this->actingAs($this->staff)
            ->postJson('/api/stores', $storeData);

        $response->assertStatus(403);

        $this->assertDatabaseMissing('stores', $storeData);
    }

    /** @test */
    public function staff_cannot_update_store()
    {
        $store = Store::factory()->create();

        $updatedData = [
            'name' => 'Staff Updated Name',
            'address' => 'Staff Updated Address'
        ];

        $response = $this->actingAs($this->staff)
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
        $store = Store::factory()->create();

        $response = $this->actingAs($this->staff)
            ->deleteJson("/api/stores/{$store->id}");

        $response->assertStatus(403);

        $this->assertDatabaseHas('stores', [
            'id' => $store->id
        ]);
    }

    /** @test */
    public function show_endpoint_can_include_relations()
    {
        $store = Store::factory()->create();
        Inventory::factory()->create(['store_id' => $store->id]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/stores/{$store->id}?include=inventories,users");

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) {
                $json->has('data.inventories')
                     ->has('data.users')
                     ->etc();
            });
    }

    /** @test */
    public function show_endpoint_handles_array_include_parameter()
    {
        $store = Store::factory()->create();
        Inventory::factory()->create(['store_id' => $store->id]);

        // Test with array parameter (e.g., ?include[]=inventories&include[]=users)
        // Simulate the request with array query parameters
        $response = $this->actingAs($this->admin)
            ->getJson("/api/stores/{$store->id}?include[]=inventories&include[]=users");

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($store) {
                $json->has('data')
                     ->where('data.id', $store->id)
                     ->has('data.inventories')
                     ->has('data.users')
                     ->etc();
            });
    }

    /** @test */
    public function show_endpoint_handles_malformed_include_parameter_gracefully()
    {
        $store = Store::factory()->create();

        // Test with invalid array parameter (?include[]=invalid_relation)
        $response = $this->actingAs($this->admin)
            ->getJson("/api/stores/{$store->id}?include[]=invalid_relation");

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($store) {
                $json->has('data')
                     ->where('data.id', $store->id)
                     ->etc();
            });
    }

    /** @test */
    public function show_endpoint_handles_empty_include_parameter()
    {
        $store = Store::factory()->create();

        // Test with empty string
        $response = $this->actingAs($this->admin)
            ->getJson("/api/stores/{$store->id}?include=");

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($store) {
                $json->has('data')
                     ->where('data.id', $store->id)
                     ->etc();
            });
    }

    /** @test */
    public function show_endpoint_handles_null_include_parameter()
    {
        $store = Store::factory()->create();

        // Test with null parameter
        $response = $this->actingAs($this->admin)
            ->getJson("/api/stores/{$store->id}", ['include' => null]);

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($store) {
                $json->has('data')
                     ->where('data.id', $store->id)
                     ->etc();
            });
    }
} 