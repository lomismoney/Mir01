<?php

namespace Tests\Unit\Services;

use App\Services\DistanceCalculator;
use PHPUnit\Framework\TestCase;

class DistanceCalculatorTest extends TestCase
{
    private DistanceCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new DistanceCalculator();
    }

    /**
     * 測試兩點之間的距離計算（使用已知距離的座標）
     * 台北 101 到台北車站的距離約為 5 公里
     */
    public function test_calculate_distance_between_two_points(): void
    {
        // 台北 101 座標
        $lat1 = 25.0339;
        $lon1 = 121.5645;
        
        // 台北車站座標
        $lat2 = 25.0478;
        $lon2 = 121.5170;
        
        $distance = $this->calculator->calculateDistance($lat1, $lon1, $lat2, $lon2);
        
        // 預期距離約為 5 公里，允許誤差
        $this->assertGreaterThan(4.8, $distance);
        $this->assertLessThan(5.2, $distance);
    }
    
    /**
     * 測試相同座標的距離為 0
     */
    public function test_distance_between_same_coordinates_is_zero(): void
    {
        $lat = 25.0339;
        $lon = 121.5645;
        
        $distance = $this->calculator->calculateDistance($lat, $lon, $lat, $lon);
        
        // 由於浮點數計算，允許極小的誤差
        $this->assertLessThan(0.01, $distance);
    }
    
    /**
     * 測試座標有效性檢查
     */
    public function test_is_valid_coordinates(): void
    {
        // 有效座標
        $this->assertTrue($this->calculator->isValidCoordinates(25.0339, 121.5645));
        $this->assertTrue($this->calculator->isValidCoordinates(-90, -180));
        $this->assertTrue($this->calculator->isValidCoordinates(90, 180));
        $this->assertTrue($this->calculator->isValidCoordinates(0, 0));
        
        // 無效座標 - null 值
        $this->assertFalse($this->calculator->isValidCoordinates(null, 121.5645));
        $this->assertFalse($this->calculator->isValidCoordinates(25.0339, null));
        $this->assertFalse($this->calculator->isValidCoordinates(null, null));
        
        // 無效座標 - 超出範圍的緯度
        $this->assertFalse($this->calculator->isValidCoordinates(91, 121.5645));
        $this->assertFalse($this->calculator->isValidCoordinates(-91, 121.5645));
        
        // 無效座標 - 超出範圍的經度
        $this->assertFalse($this->calculator->isValidCoordinates(25.0339, 181));
        $this->assertFalse($this->calculator->isValidCoordinates(25.0339, -181));
    }
    
    /**
     * 測試批量計算多個目標點的距離
     */
    public function test_calculate_distances_to_multiple(): void
    {
        // 起點：台北 101
        $originLat = 25.0339;
        $originLon = 121.5645;
        
        // 目標點
        $destinations = [
            ['id' => 1, 'lat' => 25.0350, 'lon' => 121.5650], // 很近
            ['id' => 2, 'lat' => 25.0478, 'lon' => 121.5170], // 台北車站
            ['id' => 3, 'lat' => 25.1478, 'lon' => 121.5170], // 北投區附近
            ['id' => 4], // 缺少座標，應被跳過
        ];
        
        $results = $this->calculator->calculateDistancesToMultiple($originLat, $originLon, $destinations);
        
        // 應該只返回有有效座標的 3 個結果
        $this->assertCount(3, $results);
        
        // 檢查結果包含必要欄位
        foreach ($results as $result) {
            $this->assertArrayHasKey('id', $result);
            $this->assertArrayHasKey('distance', $result);
            $this->assertArrayHasKey('lat', $result);
            $this->assertArrayHasKey('lon', $result);
        }
        
        // 驗證 ID 正確
        $this->assertEquals(1, $results[0]['id']);
        $this->assertEquals(2, $results[1]['id']);
        $this->assertEquals(3, $results[2]['id']);
    }
    
    /**
     * 測試根據距離排序目標點
     */
    public function test_sort_by_distance(): void
    {
        // 起點：台北 101
        $originLat = 25.0339;
        $originLon = 121.5645;
        
        // 目標點（故意不按距離排序）
        $destinations = [
            ['id' => 1, 'lat' => 25.1478, 'lon' => 121.5170], // 最遠
            ['id' => 2, 'lat' => 25.0350, 'lon' => 121.5650], // 最近
            ['id' => 3, 'lat' => 25.0478, 'lon' => 121.5170], // 中等
        ];
        
        // 測試升序排序（預設）
        $ascResults = $this->calculator->sortByDistance($originLat, $originLon, $destinations);
        
        $this->assertEquals(2, $ascResults[0]['id']); // 最近
        $this->assertEquals(3, $ascResults[1]['id']); // 中等
        $this->assertEquals(1, $ascResults[2]['id']); // 最遠
        
        // 驗證距離遞增
        $this->assertLessThan($ascResults[1]['distance'], $ascResults[0]['distance']);
        $this->assertLessThan($ascResults[2]['distance'], $ascResults[1]['distance']);
        
        // 測試降序排序
        $descResults = $this->calculator->sortByDistance($originLat, $originLon, $destinations, 'desc');
        
        $this->assertEquals(1, $descResults[0]['id']); // 最遠
        $this->assertEquals(3, $descResults[1]['id']); // 中等
        $this->assertEquals(2, $descResults[2]['id']); // 最近
        
        // 驗證距離遞減
        $this->assertGreaterThan($descResults[1]['distance'], $descResults[0]['distance']);
        $this->assertGreaterThan($descResults[2]['distance'], $descResults[1]['distance']);
    }
    
    /**
     * 測試極端座標的距離計算
     */
    public function test_calculate_distance_extreme_coordinates(): void
    {
        // 測試南北極之間的距離（約 20,000 公里）
        $distance = $this->calculator->calculateDistance(90, 0, -90, 0);
        $this->assertGreaterThan(19000, $distance);
        $this->assertLessThan(21000, $distance);
        
        // 測試赤道上相對兩點的距離（約 20,000 公里）
        $distance = $this->calculator->calculateDistance(0, 0, 0, 180);
        $this->assertGreaterThan(19000, $distance);
        $this->assertLessThan(21000, $distance);
    }
}