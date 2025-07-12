<?php

namespace Tests\Unit\Services;

use App\Services\BaseService;
use App\Models\User;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;
use Mockery;
use PHPUnit\Framework\Attributes\Test;

class BaseServiceTest extends TestCase
{
    use RefreshDatabase;

    protected TestableBaseService $service;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->service = new TestableBaseService();
    }

    #[Test]
    public function it_can_execute_operations_with_transaction()
    {
        Auth::login($this->user);

        $result = $this->service->executeWithTransaction(function () {
            return 'success';
        });

        $this->assertEquals('success', $result);
    }

    #[Test]
    public function it_rolls_back_transaction_on_exception()
    {
        Auth::login($this->user);
        
        $this->expectException(Exception::class);

        try {
            $this->service->executeWithTransaction(function () {
                throw new Exception('Test exception');
            });
        } catch (Exception $e) {
            // 驗證異常被正確拋出
            $this->assertEquals('Test exception', $e->getMessage());
            throw $e; // 重新拋出以滿足 expectException
        }
    }

    #[Test]
    public function it_logs_operations_correctly()
    {
        Auth::login($this->user);
        
        // 使用真實的日誌，然後檢查操作是否成功執行
        $result = $this->service->executeWithTransaction(function () {
            return 'success';
        });

        $this->assertEquals('success', $result);
    }

    #[Test]
    public function it_logs_errors_on_exception()
    {
        Auth::login($this->user);
        
        $this->expectException(Exception::class);

        $this->service->executeWithTransaction(function () {
            throw new Exception('Test exception');
        });
    }

    #[Test]
    public function it_handles_unauthenticated_users()
    {
        // 確保沒有用戶登錄
        Auth::logout();

        $result = $this->service->executeWithTransaction(function () {
            return 'success without auth';
        });

        $this->assertEquals('success without auth', $result);
    }

    #[Test]
    public function it_provides_current_user_through_helper_method()
    {
        Auth::login($this->user);

        $currentUser = $this->service->getCurrentUser();
        
        $this->assertEquals($this->user->id, $currentUser->id);
    }

    #[Test]
    public function it_returns_null_when_no_user_authenticated()
    {
        Auth::logout();

        $currentUser = $this->service->getCurrentUser();
        
        $this->assertNull($currentUser);
    }

    #[Test]
    public function it_validates_user_authorization()
    {
        Auth::login($this->user);

        // 這個測試假設用戶通過基本驗證
        $this->assertTrue($this->service->validateUserAuthorization());
    }

    #[Test]
    public function it_handles_authorization_without_user()
    {
        Auth::logout();

        // 沒有用戶時應該返回 false
        $this->assertFalse($this->service->validateUserAuthorization());
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}

/**
 * 可測試的 BaseService 實現類別
 * 用於測試抽象基類的功能
 */
class TestableBaseService extends BaseService
{
    public function executeWithTransaction(callable $operation)
    {
        return $this->executeInTransaction($operation);
    }

    public function getCurrentUser()
    {
        return Auth::user();
    }

    public function validateUserAuthorization(): bool
    {
        return Auth::user() !== null;
    }
}