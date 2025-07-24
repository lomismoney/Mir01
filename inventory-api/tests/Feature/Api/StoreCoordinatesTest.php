<?php

namespace Tests\Feature\Api;

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoreCoordinatesTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        Sanctum::actingAs($this->admin);
    }

    /** @test */
    public function it_returns_coordinates_in_store_resource()
    {
        $store = Store::factory()->create([
            'name' => '台北總店',
            'latitude' => 25.0330,
            'longitude' => 121.5654,
        ]);

        $response = $this->getJson("/api/stores/{$store->id}");

        $response->assertOk()
            ->assertJsonPath('data.latitude', 25.0330)
            ->assertJsonPath('data.longitude', 121.5654);
    }

    /** @test */
    public function it_can_create_store_with_coordinates()
    {
        $data = [
            'name' => '新竹門市',
            'code' => 'HC001',
            'address' => '新竹市東區光復路一段',
            'phone' => '03-5678900',
            'latitude' => 24.8066,
            'longitude' => 120.9687,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/stores', $data);

        $response->assertCreated()
            ->assertJsonPath('data.latitude', 24.8066)
            ->assertJsonPath('data.longitude', 120.9687);

        $this->assertDatabaseHas('stores', [
            'name' => '新竹門市',
            'latitude' => 24.8066,
            'longitude' => 120.9687,
        ]);
    }

    /** @test */
    public function it_can_update_store_coordinates()
    {
        $store = Store::factory()->create([
            'name' => '高雄門市',
            'latitude' => null,
            'longitude' => null,
        ]);

        $data = [
            'name' => '高雄門市',
            'latitude' => 22.6273,
            'longitude' => 120.3014,
        ];

        $response = $this->putJson("/api/stores/{$store->id}", $data);

        $response->assertOk()
            ->assertJsonPath('data.latitude', 22.6273)
            ->assertJsonPath('data.longitude', 120.3014);

        $this->assertDatabaseHas('stores', [
            'id' => $store->id,
            'latitude' => 22.6273,
            'longitude' => 120.3014,
        ]);
    }

    /** @test */
    public function it_validates_latitude_range()
    {
        $data = [
            'name' => '測試門市',
            'latitude' => 91, // 超出範圍
            'longitude' => 120,
        ];

        $response = $this->postJson('/api/stores', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['latitude']);
    }

    /** @test */
    public function it_validates_longitude_range()
    {
        $data = [
            'name' => '測試門市',
            'latitude' => 25,
            'longitude' => 181, // 超出範圍
        ];

        $response = $this->postJson('/api/stores', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['longitude']);
    }

    /** @test */
    public function it_validates_coordinates_must_be_numeric()
    {
        $data = [
            'name' => '測試門市',
            'latitude' => 'not_a_number',
            'longitude' => 'invalid',
        ];

        $response = $this->postJson('/api/stores', $data);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['latitude', 'longitude']);
    }

    /** @test */
    public function it_allows_null_coordinates()
    {
        $data = [
            'name' => '測試門市',
            'code' => 'TS001',
            'latitude' => null,
            'longitude' => null,
        ];

        $response = $this->postJson('/api/stores', $data);

        $response->assertCreated()
            ->assertJsonPath('data.latitude', null)
            ->assertJsonPath('data.longitude', null);
    }

    /** @test */
    public function it_shows_custom_validation_messages()
    {
        $data = [
            'name' => '測試門市',
            'latitude' => 'invalid',
            'longitude' => 200,
        ];

        $response = $this->postJson('/api/stores', $data);

        $response->assertUnprocessable()
            ->assertJsonPath('errors.latitude.0', '緯度必須為數值')
            ->assertJsonPath('errors.longitude.0', '經度必須介於 -180 到 180 之間');
    }
}