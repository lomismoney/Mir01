<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    /**
     * OpenStreetMap Nominatim API endpoint
     */
    protected const API_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

    /**
     * Cache TTL in seconds (24 hours)
     */
    protected const CACHE_TTL = 86400;

    /**
     * User agent for API requests
     */
    protected const USER_AGENT = 'InventoryManagementSystem/1.0';

    /**
     * Geocode an address to get latitude and longitude
     *
     * @param string|null $address The address to geocode
     * @return array|null Array with 'lat', 'lon', and 'display_name' keys, or null if geocoding fails
     */
    public function geocode(?string $address): ?array
    {
        // Handle empty addresses
        if (empty($address) || trim($address) === '') {
            return null;
        }

        $address = trim($address);
        $cacheKey = $this->getCacheKey($address);

        // Check cache first
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            // Make API request
            $response = Http::withHeaders([
                'User-Agent' => self::USER_AGENT,
            ])->timeout(10)
              ->get(self::API_ENDPOINT, [
                'q' => $address,
                'format' => 'json',
                'limit' => 1,
                'addressdetails' => 1,
            ]);

            if (!$response->successful()) {
                Log::warning('Geocoding API request failed', [
                    'address' => $address,
                    'status' => $response->status(),
                ]);
                return null;
            }

            $data = $response->json();

            // Check if we got results
            if (empty($data) || !isset($data[0])) {
                Log::info('No geocoding results found', ['address' => $address]);
                return null;
            }

            $result = [
                'lat' => (float) $data[0]['lat'],
                'lon' => (float) $data[0]['lon'],
                'display_name' => $data[0]['display_name'] ?? '',
            ];

            // Cache successful results only
            Cache::put($cacheKey, $result, self::CACHE_TTL);

            return $result;

        } catch (\Exception $e) {
            Log::error('Geocoding error', [
                'address' => $address,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Generate cache key for an address
     *
     * @param string $address
     * @return string
     */
    protected function getCacheKey(string $address): string
    {
        return 'geocoding:' . md5($address);
    }

    /**
     * Clear cached geocoding result for an address
     *
     * @param string $address
     * @return bool
     */
    public function clearCache(string $address): bool
    {
        return Cache::forget($this->getCacheKey($address));
    }

    /**
     * Clear all geocoding cache
     *
     * @return void
     */
    public function clearAllCache(): void
    {
        // Clear all cache entries with geocoding prefix
        // Note: This is a simplified approach. In production, you might want to use cache tags
        Cache::flush();
    }
}