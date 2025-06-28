<?php

namespace Tests\Unit;

use App\Http\Requests\InventoryAdjustmentRequest;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class InventoryAdjustmentRequestTest extends TestCase
{
    use RefreshDatabase;
} 