<?php

namespace App\Console\Commands;

use App\Models\Store;
use App\Services\GeocodingService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class UpdateStoreCoordinates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'store:update-coordinates {--force : Force update even if coordinates already exist}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update store coordinates using geocoding service';

    protected GeocodingService $geocodingService;

    public function __construct(GeocodingService $geocodingService)
    {
        parent::__construct();
        $this->geocodingService = $geocodingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');
        
        $query = Store::query();
        
        if (!$force) {
            $query->where(function ($q) {
                $q->whereNull('latitude')
                  ->orWhereNull('longitude');
            });
        }
        
        $stores = $query->get();
        
        if ($stores->isEmpty()) {
            $this->info('No stores need coordinate updates.');
            return 0;
        }
        
        $this->info("Updating coordinates for {$stores->count()} stores...");
        $progressBar = $this->output->createProgressBar($stores->count());
        $progressBar->start();
        
        $updated = 0;
        $failed = 0;
        
        foreach ($stores as $store) {
            try {
                $coordinates = $this->geocodingService->geocode($store->address);
                
                if ($coordinates) {
                    $store->updateCoordinates($coordinates['lat'], $coordinates['lon']);
                    $updated++;
                    
                    Log::info("Updated coordinates for store: {$store->name}", [
                        'store_id' => $store->id,
                        'address' => $store->address,
                        'latitude' => $coordinates['lat'],
                        'longitude' => $coordinates['lon']
                    ]);
                } else {
                    $failed++;
                    Log::warning("Failed to geocode address for store: {$store->name}", [
                        'store_id' => $store->id,
                        'address' => $store->address
                    ]);
                }
                
                // Rate limiting: sleep for 200ms between requests
                usleep(200000);
                
            } catch (\Exception $e) {
                $failed++;
                Log::error("Error updating coordinates for store: {$store->name}", [
                    'store_id' => $store->id,
                    'address' => $store->address,
                    'error' => $e->getMessage()
                ]);
            }
            
            $progressBar->advance();
        }
        
        $progressBar->finish();
        $this->newLine();
        
        $this->info("Coordinate update completed:");
        $this->info("- Updated: {$updated} stores");
        $this->info("- Failed: {$failed} stores");
        
        if ($failed > 0) {
            $this->warn("Check logs for details about failed geocoding attempts.");
        }
        
        return 0;
    }
}
