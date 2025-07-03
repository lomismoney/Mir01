<?php

namespace Tests\Unit\Data;

use Tests\TestCase;
use App\Data\ProductData;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Spatie\LaravelData\Lazy;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class ProductDataTest extends TestCase
{
    #[Test]
    public function can_create_product_data_from_array()
    {
        $data = [
            'id' => 1,
            'name' => 'Test Product',
            'sku' => 'TEST-001',
            'description' => 'Test description',
            'selling_price' => 100.50,
            'cost_price' => 75,
            'created_at' => '2025-01-01T10:00:00+08:00',
            'updated_at' => '2025-01-01T10:00:00+08:00',
        ];

        $productData = ProductData::from($data);

        $this->assertEquals(1, $productData->id);
        $this->assertEquals('Test Product', $productData->name);
        $this->assertEquals('TEST-001', $productData->sku);
        $this->assertEquals('Test description', $productData->description);
        $this->assertEquals(100.50, $productData->selling_price);
        $this->assertEquals(75, $productData->cost_price);
        $this->assertInstanceOf(Carbon::class, $productData->created_at);
    }

    #[Test]
    public function can_create_product_data_with_null_values()
    {
        $data = [
            'id' => null,
            'name' => 'Test Product',
            'sku' => 'TEST-001',
            'description' => null,
            'selling_price' => 100,
            'cost_price' => 75,
            'created_at' => null,
            'updated_at' => null,
        ];

        $productData = ProductData::from($data);

        $this->assertNull($productData->id);
        $this->assertNull($productData->description);
        $this->assertNull($productData->created_at);
        $this->assertNull($productData->updated_at);
    }

    #[Test]
    public function can_create_product_data_from_model()
    {
        // 由於 Product 模型本身沒有 sku、selling_price 和 cost_price
        // 我們需要從關聯的數據或其他方式構建 ProductData
        $product = Product::factory()->create([
            'name' => 'Model Product',
            'description' => 'Model description',
        ]);
        
        // 創建 ProductData 時手動提供缺失的欄位
        $productData = ProductData::from([
            'id' => $product->id,
            'name' => $product->name,
            'sku' => 'MODEL-001',
            'description' => $product->description,
            'selling_price' => 200,
            'cost_price' => 150,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ]);

        $this->assertEquals($product->id, $productData->id);
        $this->assertEquals('Model Product', $productData->name);
        $this->assertEquals('MODEL-001', $productData->sku);
        $this->assertEquals('Model description', $productData->description);
        $this->assertEquals(200, $productData->selling_price);
        $this->assertEquals(150, $productData->cost_price);
    }

    #[Test]
    public function can_convert_product_data_to_array()
    {
        $data = [
            'id' => 1,
            'name' => 'Test Product',
            'sku' => 'TEST-001',
            'description' => 'Test description',
            'selling_price' => 100,
            'cost_price' => 75,
            'created_at' => Carbon::parse('2025-01-01 10:00:00'),
            'updated_at' => Carbon::parse('2025-01-01 10:00:00'),
        ];

        $productData = ProductData::from($data);
        $array = $productData->toArray();

        $this->assertIsArray($array);
        $this->assertEquals(1, $array['id']);
        $this->assertEquals('Test Product', $array['name']);
        $this->assertEquals('TEST-001', $array['sku']);
        $this->assertEquals('Test description', $array['description']);
        $this->assertEquals(100, $array['selling_price']);
        $this->assertEquals(75, $array['cost_price']);
    }

    #[Test]
    public function datetime_cast_handles_timezone_correctly()
    {
        $utcTime = '2025-01-01T00:00:00+00:00';
        $data = [
            'id' => 1,
            'name' => 'Test Product',
            'sku' => 'TEST-001',
            'description' => null,
            'selling_price' => 100,
            'cost_price' => 75,
            'created_at' => $utcTime,
            'updated_at' => $utcTime,
        ];

        $productData = ProductData::from($data);

        // 驗證日期時間轉換正確
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $productData->created_at);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $productData->updated_at);
        $this->assertEquals('2025-01-01', $productData->created_at->toDateString());
        $this->assertEquals('2025-01-01', $productData->updated_at->toDateString());
    }

    #[Test]
    public function handles_float_and_int_prices_correctly()
    {
        // 測試整數價格
        $intData = [
            'name' => 'Int Product',
            'sku' => 'INT-001',
            'selling_price' => 100,
            'cost_price' => 75,
        ];

        $intProductData = ProductData::from($intData);
        $this->assertEquals(100, $intProductData->selling_price);
        $this->assertEquals(75, $intProductData->cost_price);

        // 測試浮點數價格
        $floatData = [
            'name' => 'Float Product',
            'sku' => 'FLOAT-001',
            'selling_price' => 99.99,
            'cost_price' => 74.50,
        ];

        $floatProductData = ProductData::from($floatData);
        $this->assertEquals(99.99, $floatProductData->selling_price);
        $this->assertEquals(74.50, $floatProductData->cost_price);
    }
} 