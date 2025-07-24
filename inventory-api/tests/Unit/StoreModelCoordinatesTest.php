<?php

namespace Tests\Unit;

use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreModelCoordinatesTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_store_latitude_and_longitude()
    {
        $store = Store::factory()->create([
            'name' => '測試門市',
            'latitude' => 25.0330,
            'longitude' => 121.5654,
        ]);

        $this->assertIsFloat($store->latitude);
        $this->assertIsFloat($store->longitude);
        $this->assertEquals(25.0330, $store->latitude);
        $this->assertEquals(121.5654, $store->longitude);
    }

    /** @test */
    public function it_can_update_coordinates_using_update_coordinates_method()
    {
        $store = Store::factory()->create([
            'name' => '測試門市',
            'latitude' => null,
            'longitude' => null,
        ]);

        $result = $store->updateCoordinates(25.0330, 121.5654);

        $this->assertTrue($result);
        $store->refresh();
        $this->assertEquals(25.0330, $store->latitude);
        $this->assertEquals(121.5654, $store->longitude);
    }

    /** @test */
    public function it_can_set_coordinates_to_null()
    {
        $store = Store::factory()->create([
            'name' => '測試門市',
            'latitude' => 25.0330,
            'longitude' => 121.5654,
        ]);

        $result = $store->updateCoordinates(null, null);

        $this->assertTrue($result);
        $store->refresh();
        $this->assertNull($store->latitude);
        $this->assertNull($store->longitude);
    }

    /** @test */
    public function it_casts_latitude_and_longitude_to_float()
    {
        $store = Store::factory()->create([
            'name' => '測試門市',
            'latitude' => '25.0330',
            'longitude' => '121.5654',
        ]);

        $this->assertIsFloat($store->latitude);
        $this->assertIsFloat($store->longitude);
    }
}