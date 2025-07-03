<?php

namespace Tests\Unit;

use App\Models\Store;
use App\Models\User;
use App\Services\UserStoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class UserStoreServiceTest extends TestCase
{
    use RefreshDatabase;

    protected UserStoreService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new UserStoreService();
    }

    public function test_assign_stores_successfully()
    {
        // 建立測試資料
        $user = User::factory()->create();
        $store1 = Store::factory()->create();
        $store2 = Store::factory()->create();
        $store3 = Store::factory()->create();

        // 分配分店
        $result = $this->service->assignStores($user, [$store1->id, $store2->id]);

        // 驗證分配結果
        $this->assertInstanceOf(User::class, $result);
        $this->assertEquals($user->id, $result->id);
        
        // 驗證關聯資料
        $this->assertTrue($result->relationLoaded('stores'));
        $this->assertCount(2, $result->stores);
        
        // 驗證正確的分店被分配
        $storeIds = $result->stores->pluck('id')->toArray();
        $this->assertContains($store1->id, $storeIds);
        $this->assertContains($store2->id, $storeIds);
        $this->assertNotContains($store3->id, $storeIds);
    }

    public function test_assign_stores_with_empty_array_clears_all_stores()
    {
        // 建立測試資料
        $user = User::factory()->create();
        $store1 = Store::factory()->create();
        $store2 = Store::factory()->create();

        // 先分配一些分店
        $user->stores()->attach([$store1->id, $store2->id]);
        $this->assertCount(2, $user->stores);

        // 分配空陣列（清空所有分店）
        $result = $this->service->assignStores($user, []);

        // 驗證所有分店都被清空
        $this->assertCount(0, $result->stores);
    }

    public function test_assign_stores_replaces_existing_assignments()
    {
        // 建立測試資料
        $user = User::factory()->create();
        $store1 = Store::factory()->create();
        $store2 = Store::factory()->create();
        $store3 = Store::factory()->create();

        // 先分配一些分店
        $user->stores()->attach([$store1->id, $store2->id]);
        $this->assertCount(2, $user->stores);

        // 重新分配不同的分店
        $result = $this->service->assignStores($user, [$store2->id, $store3->id]);

        // 驗證分店被替換
        $this->assertCount(2, $result->stores);
        $storeIds = $result->stores->pluck('id')->toArray();
        $this->assertNotContains($store1->id, $storeIds);
        $this->assertContains($store2->id, $storeIds);
        $this->assertContains($store3->id, $storeIds);
    }

    public function test_assign_stores_handles_duplicate_store_ids()
    {
        // 建立測試資料
        $user = User::factory()->create();
        $store1 = Store::factory()->create();
        $store2 = Store::factory()->create();

        // 分配重複的分店 ID
        $result = $this->service->assignStores($user, [$store1->id, $store2->id, $store1->id]);

        // 驗證重複的 ID 被正確處理
        $this->assertCount(2, $result->stores);
        $storeIds = $result->stores->pluck('id')->toArray();
        $this->assertContains($store1->id, $storeIds);
        $this->assertContains($store2->id, $storeIds);
    }

    public function test_assign_stores_with_transaction_rollback_on_exception()
    {
        // 建立測試資料
        $user = User::factory()->create();
        $store = Store::factory()->create();

        // 模擬資料庫例外
        DB::shouldReceive('transaction')
            ->once()
            ->andThrow(new \Exception('Database connection error'));

        // 模擬 Log 記錄
        Log::shouldReceive('error')
            ->once()
            ->with(
                '為用戶分配分店時發生資料庫錯誤',
                \Mockery::on(function ($context) use ($user, $store) {
                    return $context['user_id'] === $user->id 
                        && $context['store_ids'] === [$store->id]
                        && $context['exception'] instanceof \Exception;
                })
            );

        // 驗證例外被重新拋出
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Database connection error');

        $this->service->assignStores($user, [$store->id]);
    }

    public function test_assign_stores_logs_error_with_correct_context()
    {
        // 建立測試資料
        $user = User::factory()->create();
        $store1 = Store::factory()->create();
        $store2 = Store::factory()->create();

        // 模擬資料庫例外
        $exception = new \Exception('Test database error');
        DB::shouldReceive('transaction')
            ->once()
            ->andThrow($exception);

        // 驗證 Log 記錄的內容
        Log::shouldReceive('error')
            ->once()
            ->with(
                '為用戶分配分店時發生資料庫錯誤',
                [
                    'user_id' => $user->id,
                    'store_ids' => [$store1->id, $store2->id],
                    'exception' => $exception
                ]
            );

        // 執行並驗證例外
        $this->expectException(\Exception::class);
        $this->service->assignStores($user, [$store1->id, $store2->id]);
    }

    public function test_assign_stores_uses_database_transaction()
    {
        // 建立測試資料
        $user = User::factory()->create();
        $store = Store::factory()->create();

        // 驗證 DB::transaction 被呼叫
        DB::shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        // 模擬用戶載入關聯
        $user = \Mockery::mock($user)->makePartial();
        $user->shouldReceive('load')
            ->once()
            ->with('stores')
            ->andReturnSelf();

        $user->shouldReceive('stores->sync')
            ->once()
            ->with([$store->id]);

        $result = $this->service->assignStores($user, [$store->id]);

        $this->assertInstanceOf(User::class, $result);
    }
} 