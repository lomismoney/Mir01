<?php

namespace App\Events;

use App\Models\Inventory;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockExhausted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Inventory $inventory;

    /**
     * Create a new event instance.
     */
    public function __construct(Inventory $inventory)
    {
        $this->inventory = $inventory;
    }
}