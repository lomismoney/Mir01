<?php

namespace Tests\Unit;

use App\Http\Requests\Api\DestroyMultipleProductsRequest;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class DestroyMultipleProductsRequestTest extends TestCase
{
    use RefreshDatabase;
} 