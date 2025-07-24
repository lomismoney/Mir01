<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\StockTransferService;
use App\Services\DistanceCalculator;
use App\Models\Store;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class StockTransferServiceTest extends TestCase
{
    use RefreshDatabase;

    protected StockTransferService $service;
    protected $mockDistanceCalculator;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDistanceCalculator = Mockery::mock(DistanceCalculator::class);
        $this->service = new StockTransferService($this->mockDistanceCalculator);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_find_optimal_transfer_stores_based_on_distance()
    {
        // 建立測試數據
        $targetStore = Store::factory()->create([
            'name' => '目標店舖',
            'latitude' => 25.0330,  // 台北
            'longitude' => 121.5654,
        ]);

        $nearStore = Store::factory()->create([
            'name' => '近距離店舖',
            'latitude' => 25.0478,  // 台北市區
            'longitude' => 121.5318,
        ]);

        $farStore = Store::factory()->create([
            'name' => '遠距離店舖', 
            'latitude' => 24.1477,  // 台中
            'longitude' => 120.6736,
        ]);

        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        // 建立庫存
        Inventory::factory()->create([
            'store_id' => $nearStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 10,
        ]);

        Inventory::factory()->create([
            'store_id' => $farStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 15,
        ]);

        // Mock 座標驗證和距離計算
        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(25.0330, 121.5654)
            ->andReturn(true);

        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->twice()
            ->andReturn(true);

        $this->mockDistanceCalculator
            ->shouldReceive('calculateDistancesToMultiple')
            ->once()
            ->andReturn([
                ['id' => $nearStore->id, 'distance' => 2.5],
                ['id' => $farStore->id, 'distance' => 150.0],
            ]);

        // 執行測試
        $result = $this->service->findOptimalTransferStores(
            $targetStore->id,
            $variant->id,
            5
        );

        // 驗證結果
        $this->assertCount(2, $result);
        
        // 第一個應該是近距離店舖（按距離排序）
        $this->assertEquals($nearStore->id, $result[0]['store_id']);
        $this->assertEquals(2.5, $result[0]['distance']);
        $this->assertEquals(5, $result[0]['suggested_quantity']); // 需要5個，該店有10個
        
        // 第二個應該是遠距離店舖
        $this->assertEquals($farStore->id, $result[1]['store_id']);
        $this->assertEquals(150.0, $result[1]['distance']);
        $this->assertEquals(5, $result[1]['suggested_quantity']);
    }

    /** @test */
    public function it_falls_back_to_stock_quantity_sorting_when_target_store_has_no_coordinates()
    {
        // 建立目標店舖（無座標）
        $targetStore = Store::factory()->create([
            'name' => '無座標目標店舖',
            'latitude' => null,
            'longitude' => null,
        ]);

        // 建立來源店舖
        $highStockStore = Store::factory()->create(['name' => '高庫存店舖']);
        $lowStockStore = Store::factory()->create(['name' => '低庫存店舖']);

        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        // 建立庫存
        Inventory::factory()->create([
            'store_id' => $highStockStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 20,
        ]);

        Inventory::factory()->create([
            'store_id' => $lowStockStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 5,
        ]);

        // Mock 座標驗證 - 目標店舖無座標
        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(null, null)
            ->andReturn(false);

        // 執行測試
        $result = $this->service->findOptimalTransferStores(
            $targetStore->id,
            $variant->id,
            10
        );

        // 驗證結果：應該按庫存量排序（高到低）
        $this->assertCount(2, $result);
        $this->assertEquals($highStockStore->id, $result[0]['store_id']);
        $this->assertEquals(20, $result[0]['available_quantity']);
        $this->assertEquals($lowStockStore->id, $result[1]['store_id']);
        $this->assertEquals(5, $result[1]['available_quantity']);
    }

    /** @test */
    public function it_handles_mixed_coordinates_scenario()
    {
        // 目標店舖有座標
        $targetStore = Store::factory()->create([
            'latitude' => 25.0330,
            'longitude' => 121.5654,
        ]);

        // 部分來源店舖有座標，部分沒有
        $storeWithCoords = Store::factory()->create([
            'name' => '有座標店舖',
            'latitude' => 25.0478,
            'longitude' => 121.5318,
        ]);

        $storeWithoutCoords = Store::factory()->create([
            'name' => '無座標店舖',
            'latitude' => null,
            'longitude' => null,
        ]);

        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        // 建立庫存
        Inventory::factory()->create([
            'store_id' => $storeWithCoords->id,
            'product_variant_id' => $variant->id,
            'quantity' => 8,
        ]);

        Inventory::factory()->create([
            'store_id' => $storeWithoutCoords->id,
            'product_variant_id' => $variant->id,
            'quantity' => 12,
        ]);

        // Mock 座標驗證
        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(25.0330, 121.5654)
            ->andReturn(true);

        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(25.0478, 121.5318)
            ->andReturn(true);

        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(null, null)
            ->andReturn(false);

        // Mock 距離計算（只對有座標的店舖計算）
        $this->mockDistanceCalculator
            ->shouldReceive('calculateDistancesToMultiple')
            ->once()
            ->andReturn([
                ['id' => $storeWithCoords->id, 'distance' => 2.5],
            ]);

        // 執行測試
        $result = $this->service->findOptimalTransferStores(
            $targetStore->id,
            $variant->id,
            5
        );

        // 驗證結果：有座標的在前（按距離），無座標的在後（按庫存）
        $this->assertCount(2, $result);
        
        // 第一個應該是有座標的店舖
        $this->assertEquals($storeWithCoords->id, $result[0]['store_id']);
        $this->assertEquals(2.5, $result[0]['distance']);
        
        // 第二個應該是無座標的店舖
        $this->assertEquals($storeWithoutCoords->id, $result[1]['store_id']);
        $this->assertNull($result[1]['distance']);
    }

    /** @test */  
    public function it_returns_empty_array_when_no_stores_have_sufficient_stock()
    {
        $targetStore = Store::factory()->create();
        $sourceStore = Store::factory()->create();
        
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        // 建立庫存為0的記錄（查詢條件是 quantity > 0，所以會過濾掉）
        Inventory::factory()->create([
            'store_id' => $sourceStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 0,
        ]);

        $result = $this->service->findOptimalTransferStores(
            $targetStore->id,
            $variant->id,
            5
        );

        $this->assertEmpty($result);
    }

    /** @test */
    public function it_excludes_target_store_from_transfer_options()
    {
        $targetStore = Store::factory()->create([
            'latitude' => 25.0330,
            'longitude' => 121.5654,
        ]);

        $otherStore = Store::factory()->create([
            'latitude' => 25.0478,
            'longitude' => 121.5318,
        ]);

        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        // 目標店舖和其他店舖都有庫存
        Inventory::factory()->create([
            'store_id' => $targetStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 20,
        ]);

        Inventory::factory()->create([
            'store_id' => $otherStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 15,
        ]);

        // Mock 座標驗證
        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(25.0330, 121.5654)
            ->andReturn(true);

        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(25.0478, 121.5318)
            ->andReturn(true);

        $this->mockDistanceCalculator
            ->shouldReceive('calculateDistancesToMultiple')
            ->once()
            ->andReturn([
                ['id' => $otherStore->id, 'distance' => 2.5],
            ]);

        $result = $this->service->findOptimalTransferStores(
            $targetStore->id,
            $variant->id,
            10
        );

        // 驗證結果只包含其他店舖，不包含目標店舖
        $this->assertCount(1, $result);
        $this->assertEquals($otherStore->id, $result[0]['store_id']);
    }

    /** @test */
    public function it_calculates_suggested_quantity_correctly()
    {
        $targetStore = Store::factory()->create([
            'latitude' => 25.0330,
            'longitude' => 121.5654,
        ]);

        $sourceStore = Store::factory()->create([
            'latitude' => 25.0478,
            'longitude' => 121.5318,
        ]);

        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        Inventory::factory()->create([
            'store_id' => $sourceStore->id,
            'product_variant_id' => $variant->id,
            'quantity' => 8, // 有8個但需要10個
        ]);

        // Mock 座標驗證
        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(25.0330, 121.5654)
            ->andReturn(true);

        $this->mockDistanceCalculator
            ->shouldReceive('isValidCoordinates')
            ->once()
            ->with(25.0478, 121.5318)
            ->andReturn(true);

        $this->mockDistanceCalculator
            ->shouldReceive('calculateDistancesToMultiple')
            ->once()
            ->andReturn([
                ['id' => $sourceStore->id, 'distance' => 2.5],
            ]);

        $result = $this->service->findOptimalTransferStores(
            $targetStore->id,
            $variant->id,
            10 // 需要10個
        );

        $this->assertCount(1, $result);
        $this->assertEquals(8, $result[0]['suggested_quantity']); // 建議調8個（全部可用庫存）
        $this->assertEquals(8, $result[0]['available_quantity']);
    }
}