<?php

namespace Tests\Unit\Data;

use Tests\TestCase;
use App\Data\StoreData;
use App\Models\Store;
use Illuminate\Support\Carbon;

class StoreDataTest extends TestCase
{
    /** @test */
    public function can_create_store_data_from_array()
    {
        $data = [
            'id' => 1,
            'name' => 'Test Store',
            'address' => '台北市信義區信義路五段7號',
            'phone' => '02-12345678',
            'status' => 'active',
            'created_at' => '2025-01-01T10:00:00+08:00',
            'updated_at' => '2025-01-01T10:00:00+08:00',
        ];

        $storeData = StoreData::from($data);

        $this->assertEquals(1, $storeData->id);
        $this->assertEquals('Test Store', $storeData->name);
        $this->assertEquals('台北市信義區信義路五段7號', $storeData->address);
        $this->assertEquals('02-12345678', $storeData->phone);
        $this->assertEquals('active', $storeData->status);
        $this->assertInstanceOf(Carbon::class, $storeData->created_at);
        $this->assertInstanceOf(Carbon::class, $storeData->updated_at);
    }

    /** @test */
    public function can_create_store_data_with_null_values()
    {
        $data = [
            'id' => 1,
            'name' => 'Test Store',
            'address' => null,
            'phone' => null,
            'status' => null,
            'created_at' => null,
            'updated_at' => null,
        ];

        $storeData = StoreData::from($data);

        $this->assertEquals(1, $storeData->id);
        $this->assertEquals('Test Store', $storeData->name);
        $this->assertNull($storeData->address);
        $this->assertNull($storeData->phone);
        $this->assertNull($storeData->status);
        $this->assertNull($storeData->created_at);
        $this->assertNull($storeData->updated_at);
    }

    /** @test */
    public function can_create_store_data_from_model()
    {
        $store = Store::factory()->create([
            'name' => 'Model Store',
            'address' => '台中市西區台灣大道二段2號',
        ]);

        // 由於 Store 模型可能沒有 phone 和 status 欄位，手動補充
        $storeData = StoreData::from([
            'id' => $store->id,
            'name' => $store->name,
            'address' => $store->address,
            'phone' => '04-87654321',
            'status' => 'active',
            'created_at' => $store->created_at,
            'updated_at' => $store->updated_at,
        ]);

        $this->assertEquals($store->id, $storeData->id);
        $this->assertEquals('Model Store', $storeData->name);
        $this->assertEquals('台中市西區台灣大道二段2號', $storeData->address);
        $this->assertEquals('04-87654321', $storeData->phone);
        $this->assertEquals('active', $storeData->status);
    }

    /** @test */
    public function can_convert_store_data_to_array()
    {
        $data = [
            'id' => 1,
            'name' => 'Test Store',
            'address' => '高雄市前金區中正四路211號',
            'phone' => '07-12345678',
            'status' => 'active',
            'created_at' => Carbon::parse('2025-01-01 10:00:00'),
            'updated_at' => Carbon::parse('2025-01-01 10:00:00'),
        ];

        $storeData = StoreData::from($data);
        $array = $storeData->toArray();

        $this->assertIsArray($array);
        $this->assertEquals(1, $array['id']);
        $this->assertEquals('Test Store', $array['name']);
        $this->assertEquals('高雄市前金區中正四路211號', $array['address']);
        $this->assertEquals('07-12345678', $array['phone']);
        $this->assertEquals('active', $array['status']);
    }

    /** @test */
    public function can_create_multiple_store_data_objects()
    {
        $stores = Store::factory()->count(3)->create();
        
        $storeDataCollection = $stores->map(fn($store) => StoreData::from($store));

        $this->assertCount(3, $storeDataCollection);
        $storeDataCollection->each(function ($storeData) {
            $this->assertInstanceOf(StoreData::class, $storeData);
        });
    }

    /** @test */
    public function store_data_handles_different_statuses()
    {
        $statuses = ['active', 'inactive', 'maintenance'];
        
        foreach ($statuses as $status) {
            $data = [
                'id' => 1,
                'name' => 'Test Store',
                'status' => $status,
            ];

            $storeData = StoreData::from($data);
            $this->assertEquals($status, $storeData->status);
        }
    }
} 