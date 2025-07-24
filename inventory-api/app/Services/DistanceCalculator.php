<?php

namespace App\Services;

/**
 * 距離計算服務
 * 
 * 提供基於經緯度座標的距離計算功能
 * 使用 Haversine 公式計算兩點之間的直線距離
 */
class DistanceCalculator
{
    /**
     * 地球半徑（公里）
     */
    private const EARTH_RADIUS_KM = 6371;

    /**
     * 計算兩個經緯度座標之間的距離
     * 
     * 使用 Haversine 公式計算兩點之間的直線距離
     * 
     * @param float $lat1 起點緯度
     * @param float $lon1 起點經度
     * @param float $lat2 終點緯度
     * @param float $lon2 終點經度
     * @return float 距離（公里）
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        // 將角度轉換為弧度
        $lat1Rad = deg2rad($lat1);
        $lon1Rad = deg2rad($lon1);
        $lat2Rad = deg2rad($lat2);
        $lon2Rad = deg2rad($lon2);

        // 計算差值
        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLon = $lon2Rad - $lon1Rad;

        // Haversine 公式
        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLon / 2) * sin($deltaLon / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        // 計算距離
        return self::EARTH_RADIUS_KM * $c;
    }

    /**
     * 批量計算多個目標點與起點的距離
     * 
     * @param float $originLat 起點緯度
     * @param float $originLon 起點經度
     * @param array $destinations 目標點陣列 [['lat' => float, 'lon' => float, 'id' => mixed], ...]
     * @return array 結果陣列 [['id' => mixed, 'distance' => float], ...]
     */
    public function calculateDistancesToMultiple(float $originLat, float $originLon, array $destinations): array
    {
        $results = [];

        foreach ($destinations as $destination) {
            if (!isset($destination['lat'], $destination['lon'])) {
                continue;
            }

            $distance = $this->calculateDistance(
                $originLat,
                $originLon,
                $destination['lat'],
                $destination['lon']
            );

            $results[] = [
                'id' => $destination['id'] ?? null,
                'distance' => $distance,
                'lat' => $destination['lat'],
                'lon' => $destination['lon'],
            ];
        }

        return $results;
    }

    /**
     * 根據距離排序目標點
     * 
     * @param float $originLat 起點緯度
     * @param float $originLon 起點經度
     * @param array $destinations 目標點陣列
     * @param string $sortDirection 排序方向 ('asc' 或 'desc')
     * @return array 排序後的結果陣列
     */
    public function sortByDistance(float $originLat, float $originLon, array $destinations, string $sortDirection = 'asc'): array
    {
        $results = $this->calculateDistancesToMultiple($originLat, $originLon, $destinations);

        usort($results, function ($a, $b) use ($sortDirection) {
            if ($sortDirection === 'desc') {
                return $b['distance'] <=> $a['distance'];
            }
            return $a['distance'] <=> $b['distance'];
        });

        return $results;
    }

    /**
     * 檢查座標是否有效
     * 
     * @param float|null $lat 緯度
     * @param float|null $lon 經度
     * @return bool
     */
    public function isValidCoordinates(?float $lat, ?float $lon): bool
    {
        if ($lat === null || $lon === null) {
            return false;
        }

        // 檢查緯度範圍 (-90 to 90)
        if ($lat < -90 || $lat > 90) {
            return false;
        }

        // 檢查經度範圍 (-180 to 180)
        if ($lon < -180 || $lon > 180) {
            return false;
        }

        return true;
    }
}