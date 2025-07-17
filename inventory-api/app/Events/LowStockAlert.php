<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowStockAlert
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Inventory $inventory;
    public int $currentQuantity;
    public int $threshold;

    /**
     * Create a new event instance.
     */
    public function __construct(Inventory $inventory, int $currentQuantity, int $threshold)
    {
        $this->inventory = $inventory;
        $this->currentQuantity = $currentQuantity;
        $this->threshold = $threshold;
    }
}