<?php

namespace Tests\Unit\Services;

use App\Services\GeocodingService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GeocodingServiceTest extends TestCase
{
    protected GeocodingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new GeocodingService();
        
        // 清除快取以確保測試獨立性
        Cache::flush();
    }

    /** @test */
    public function it_can_geocode_valid_address()
    {
        // Arrange
        $address = '台北市信義區市府路1號';
        $expectedResponse = [
            [
                'lat' => '25.0375198',
                'lon' => '121.5636796',
                'display_name' => 'Taipei City Hall, 1, 市府路, 信義區, 臺北市, 11008, 臺灣',
            ]
        ];

        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response($expectedResponse, 200),
        ]);

        // Act
        $result = $this->service->geocode($address);

        // Assert
        $this->assertNotNull($result);
        $this->assertArrayHasKey('lat', $result);
        $this->assertArrayHasKey('lon', $result);
        $this->assertEquals(25.0375198, $result['lat']);
        $this->assertEquals(121.5636796, $result['lon']);
        $this->assertEquals('Taipei City Hall, 1, 市府路, 信義區, 臺北市, 11008, 臺灣', $result['display_name']);
    }

    /** @test */
    public function it_returns_null_for_invalid_address()
    {
        // Arrange
        $address = 'This is definitely not a real address XYZ123';
        
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([], 200),
        ]);

        // Act
        $result = $this->service->geocode($address);

        // Assert
        $this->assertNull($result);
    }

    /** @test */
    public function it_handles_api_errors_gracefully()
    {
        // Arrange
        $address = '台北市信義區市府路1號';
        
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response(null, 500),
        ]);

        // Act
        $result = $this->service->geocode($address);

        // Assert
        $this->assertNull($result);
    }

    /** @test */
    public function it_handles_network_errors_gracefully()
    {
        // Arrange
        $address = '台北市信義區市府路1號';
        
        // 模擬網路錯誤 - 直接拋出例外
        Http::fake(function () {
            throw new \Exception('Network error');
        });

        // Act
        $result = $this->service->geocode($address);

        // Assert
        $this->assertNull($result);
    }

    /** @test */
    public function it_caches_successful_geocoding_results()
    {
        // Arrange
        $address = '台北市信義區市府路1號';
        $expectedResponse = [
            [
                'lat' => '25.0375198',
                'lon' => '121.5636796',
                'display_name' => 'Taipei City Hall',
            ]
        ];

        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response($expectedResponse, 200),
        ]);

        // Act - 第一次呼叫
        $result1 = $this->service->geocode($address);
        
        // 驗證 API 被呼叫一次
        Http::assertSentCount(1);

        // Act - 第二次呼叫相同地址
        $result2 = $this->service->geocode($address);

        // Assert
        // API 應該仍然只被呼叫一次（第二次從快取取得）
        Http::assertSentCount(1);
        $this->assertEquals($result1, $result2);
    }

    /** @test */
    public function it_does_not_cache_failed_results()
    {
        // Arrange
        $address = 'Invalid address';
        
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::sequence()
                ->push([], 200)  // 第一次返回空結果
                ->push([['lat' => '25.0', 'lon' => '121.0', 'display_name' => 'Found']], 200), // 第二次返回結果
        ]);

        // Act
        $result1 = $this->service->geocode($address);
        $result2 = $this->service->geocode($address);

        // Assert
        $this->assertNull($result1);
        $this->assertNotNull($result2);
        Http::assertSentCount(2); // 應該發送兩次請求，因為失敗結果不應被快取
    }

    /** @test */
    public function it_respects_cache_ttl()
    {
        // Arrange
        $address = '台北市信義區市府路1號';
        $cacheKey = 'geocoding:' . md5($address);
        $expectedResponse = [
            [
                'lat' => '25.0375198',
                'lon' => '121.5636796',
                'display_name' => 'Taipei City Hall',
            ]
        ];

        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response($expectedResponse, 200),
        ]);

        // Act
        $result = $this->service->geocode($address);

        // Assert - 確認快取存在
        $this->assertTrue(Cache::has($cacheKey));
        
        // 快取應該在 24 小時內有效（這裡只檢查快取存在）
        $cachedValue = Cache::get($cacheKey);
        $this->assertEquals($result, $cachedValue);
    }

    /** @test */
    public function it_includes_proper_headers_in_api_request()
    {
        // Arrange
        $address = '台北市信義區市府路1號';
        
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([[
                'lat' => '25.0375198',
                'lon' => '121.5636796',
                'display_name' => 'Test',
            ]], 200),
        ]);

        // Act
        $this->service->geocode($address);

        // Assert
        Http::assertSent(function ($request) {
            return $request->hasHeader('User-Agent') &&
                   str_contains($request->header('User-Agent')[0], 'InventoryManagementSystem');
        });
    }

    /** @test */
    public function it_handles_empty_address_gracefully()
    {
        // Act & Assert
        $this->assertNull($this->service->geocode(''));
        $this->assertNull($this->service->geocode(null));
        $this->assertNull($this->service->geocode('   '));
        
        // 不應該發送任何 HTTP 請求
        Http::assertNothingSent();
    }

    /** @test */  
    public function it_formats_address_for_api_request()
    {
        // Arrange
        $address = '台北市 信義區 市府路 1號';
        
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([[
                'lat' => '25.0375198',
                'lon' => '121.5636796',
                'display_name' => 'Test',
            ]], 200),
        ]);

        // Act
        $result = $this->service->geocode($address);

        // Assert - 確認 API 被正確呼叫和取得結果
        Http::assertSentCount(1);
        $this->assertNotNull($result);
        $this->assertEquals(25.0375198, $result['lat']);
        $this->assertEquals(121.5636796, $result['lon']);
    }
}