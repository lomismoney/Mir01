<?php

namespace App\Events;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryAnomalyDetected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Inventory $inventory;
    public InventoryTransaction $transaction;
    public array $anomalyDetails;

    /**
     * Create a new event instance.
     */
    public function __construct(Inventory $inventory, InventoryTransaction $transaction, array $anomalyDetails)
    {
        $this->inventory = $inventory;
        $this->transaction = $transaction;
        $this->anomalyDetails = $anomalyDetails;
    }
}