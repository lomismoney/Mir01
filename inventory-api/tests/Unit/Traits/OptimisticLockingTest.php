<?php

namespace Tests\Unit\Traits;

use Tests\TestCase;
use App\Traits\OptimisticLocking;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;
use Exception;

class OptimisticLockingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試表
        Schema::create('test_models', function ($table) {
            $table->id();
            $table->string('name');
            $table->integer('version')->default(0);
            $table->timestamps();
        });
    }

    #[Test]
    public function it_increments_version_on_update()
    {
        $model = TestOptimisticModel::create(['name' => 'Test']);
        $this->assertEquals(0, $model->version);
        
        $model->update(['name' => 'Updated']);
        $this->assertEquals(1, $model->version);
        
        $model->update(['name' => 'Updated Again']);
        $this->assertEquals(2, $model->version);
    }

    #[Test]
    public function it_detects_concurrent_update_conflict()
    {
        $model = TestOptimisticModel::create(['name' => 'Test']);
        
        // 模擬另一個進程更新了記錄
        $anotherInstance = TestOptimisticModel::find($model->id);
        $anotherInstance->update(['name' => 'Updated by another process']);
        
        // 嘗試更新原始實例應該失敗
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('樂觀鎖衝突');
        
        $model->update(['name' => 'This should fail']);
    }

    #[Test]
    public function it_does_not_increment_version_on_create()
    {
        $model = TestOptimisticModel::create(['name' => 'New Model']);
        
        // 新創建的記錄版本應該是0
        $this->assertEquals(0, $model->version);
    }

    #[Test]
    public function it_updates_with_lock_returns_false_on_conflict()
    {
        $model = TestOptimisticModel::create(['name' => 'Test']);
        
        // 另一個進程更新記錄
        TestOptimisticModel::find($model->id)->update(['name' => 'Updated']);
        
        // updateWithLock 應該返回 false 而不是拋出異常
        $result = $model->updateWithLock(['name' => 'Failed Update']);
        
        $this->assertFalse($result);
        
        // 模型應該被刷新到最新狀態
        $this->assertEquals('Updated', $model->name);
        $this->assertEquals(1, $model->version);
    }

    #[Test]
    public function it_updates_with_lock_returns_true_on_success()
    {
        $model = TestOptimisticModel::create(['name' => 'Test']);
        
        $result = $model->updateWithLock(['name' => 'Successfully Updated']);
        
        $this->assertTrue($result);
        $this->assertEquals('Successfully Updated', $model->name);
        $this->assertEquals(1, $model->version);
    }

    #[Test]
    public function it_retries_update_on_conflict()
    {
        $model = TestOptimisticModel::create(['name' => 'Test']);
        $updateCount = 0;
        
        $result = $model->retryUpdate(function ($m) use (&$updateCount) {
            $updateCount++;
            
            // 第一次嘗試時，模擬另一個進程更新
            if ($updateCount === 1) {
                TestOptimisticModel::find($m->id)->update(['name' => 'Concurrent Update']);
            }
            
            $m->name = 'Final Update';
        });
        
        $this->assertTrue($result);
        $this->assertEquals(2, $updateCount); // 應該重試了一次
        $this->assertEquals('Final Update', $model->fresh()->name);
    }

    #[Test]
    public function it_throws_exception_after_max_retry_attempts()
    {
        $model = TestOptimisticModel::create(['name' => 'Test']);
        $updateCount = 0;
        
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('樂觀鎖衝突');
        
        $model->retryUpdate(function ($m) use (&$updateCount) {
            $updateCount++;
            
            // 每次都模擬衝突
            TestOptimisticModel::find($m->id)->update(['name' => "Update $updateCount"]);
            
            $m->name = 'This will never succeed';
        }, maxAttempts: 2);
    }

    #[Test]
    public function it_uses_custom_version_column()
    {
        // 創建使用自定義版本欄位的表
        Schema::create('custom_version_models', function ($table) {
            $table->id();
            $table->string('name');
            $table->integer('revision')->default(0);
            $table->timestamps();
        });
        
        $model = TestCustomVersionModel::create(['name' => 'Test']);
        $this->assertEquals(0, $model->revision);
        
        $model->update(['name' => 'Updated']);
        $this->assertEquals(1, $model->revision);
    }

    #[Test]
    public function it_handles_non_optimistic_lock_exceptions()
    {
        $model = TestOptimisticModel::create(['name' => 'Test']);
        
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Other error');
        
        $model->retryUpdate(function ($m) {
            throw new Exception('Other error');
        });
    }

    #[Test]
    public function it_does_not_check_version_when_creating()
    {
        // 創建新記錄時不應該檢查版本
        $model = new TestOptimisticModel(['name' => 'New Model']);
        
        // 應該成功保存
        $this->assertTrue($model->save());
        $this->assertEquals(0, $model->version);
    }

    #[Test]
    public function it_synchronizes_original_version_after_increment()
    {
        $model = TestOptimisticModel::create(['name' => 'Test']);
        
        $model->update(['name' => 'Updated']);
        
        // 驗證原始值已同步
        $this->assertEquals(1, $model->version);
        $this->assertEquals(1, $model->getOriginal('version'));
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('test_models');
        Schema::dropIfExists('custom_version_models');
        parent::tearDown();
    }
}

/**
 * 測試用模型
 */
class TestOptimisticModel extends Model
{
    use OptimisticLocking;
    
    protected $table = 'test_models';
    protected $fillable = ['name'];
}

/**
 * 使用自定義版本欄位的測試模型
 */
class TestCustomVersionModel extends Model
{
    use OptimisticLocking;
    
    protected $table = 'custom_version_models';
    protected $fillable = ['name'];
    protected $versionColumn = 'revision';
}