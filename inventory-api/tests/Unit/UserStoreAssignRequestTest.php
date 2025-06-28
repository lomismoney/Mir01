<?php

namespace Tests\Unit;

use App\Http\Requests\Api\UserStoreAssignRequest;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class UserStoreAssignRequestTest extends TestCase
{
    use RefreshDatabase;
} 