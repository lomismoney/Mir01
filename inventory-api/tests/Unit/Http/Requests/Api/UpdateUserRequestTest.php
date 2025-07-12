<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\UpdateUserRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UpdateUserRequestTest extends TestCase
{
    use RefreshDatabase;

    private UpdateUserRequest $request;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建角色
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'viewer']);
        
        // 創建測試用戶
        $this->user = User::factory()->create([
            'name' => 'Test User',
            'username' => 'testuser',
        ]);
        
        // 創建請求並設置路由參數
        $this->request = new UpdateUserRequest();
        $user = $this->user;
        $this->request->setRouteResolver(function () use ($user) {
            return new class($user) {
                private $user;
                
                public function __construct($user) {
                    $this->user = $user;
                }
                
                public function parameter($key) {
                    return $this->user;
                }
            };
        });
    }

    /**
     * 測試授權方法返回 true
     */
    public function test_authorize_returns_true()
    {
        $this->assertTrue($this->request->authorize());
    }

    /**
     * 測試空請求通過驗證（所有欄位都是可選的）
     */
    public function test_empty_request_passes_validation()
    {
        $emptyData = [];

        $validator = Validator::make($emptyData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試有效的部分更新資料
     */
    public function test_valid_partial_update_data()
    {
        $validData = [
            'name' => 'Updated Name',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試姓名更新驗證
     */
    public function test_name_update_validation()
    {
        // 有效的姓名
        $validData = ['name' => 'New Name'];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());

        // 空的姓名（如果提供了 name 欄位，則不能為空）
        $invalidData = ['name' => ''];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());

        // 非字串的姓名
        $invalidData = ['name' => 123];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());

        // 超過長度限制的姓名
        $invalidData = ['name' => str_repeat('a', 256)];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試用戶名更新驗證
     */
    public function test_username_update_validation()
    {
        // 有效的用戶名
        $validData = ['username' => 'newusername'];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());

        // 空的用戶名（如果提供了 username 欄位，則不能為空）
        $invalidData = ['username' => ''];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('username', $validator->errors()->toArray());

        // 非字串的用戶名
        $invalidData = ['username' => 123];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('username', $validator->errors()->toArray());

        // 超過長度限制的用戶名
        $invalidData = ['username' => str_repeat('a', 256)];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('username', $validator->errors()->toArray());
    }

    /**
     * 測試用戶名唯一性驗證（排除當前用戶）
     */
    public function test_username_uniqueness_ignores_current_user()
    {
        // 創建另一個用戶
        $otherUser = User::factory()->create(['username' => 'otherusername']);

        // 更新為已存在的用戶名應該失敗
        $invalidData = ['username' => 'otherusername'];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('username', $validator->errors()->toArray());

        // 保持相同的用戶名應該成功（忽略當前用戶）
        $validData = ['username' => $this->user->username];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試密碼更新驗證
     */
    public function test_password_update_validation()
    {
        // 有效的密碼
        $validData = [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());

        // 空的密碼（如果提供了 password 欄位，則不能為空）
        $invalidData = ['password' => ''];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());

        // 非字串的密碼
        $invalidData = ['password' => 123];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());

        // 太短的密碼
        $invalidData = [
            'password' => '1234567',
            'password_confirmation' => '1234567',
        ];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());

        // 密碼確認不匹配
        $invalidData = [
            'password' => 'newpassword123',
            'password_confirmation' => 'differentpassword',
        ];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * 測試角色更新驗證
     */
    public function test_roles_update_validation()
    {
        // 有效的角色
        $validData = ['roles' => ['admin', 'staff']];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());

        // 空角色陣列
        $validData = ['roles' => []];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());

        // 非陣列的角色
        $invalidData = ['roles' => 'admin'];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('roles', $validator->errors()->toArray());

        // 無效的角色
        $invalidData = ['roles' => ['invalid_role']];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('roles.0', $validator->errors()->toArray());

        // 混合有效和無效角色
        $invalidData = ['roles' => ['admin', 'invalid_role']];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('roles.1', $validator->errors()->toArray());
    }

    /**
     * 測試完整的有效更新資料
     */
    public function test_complete_valid_update_data()
    {
        $validData = [
            'name' => 'Updated Name',
            'username' => 'updatedusername',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
            'roles' => ['admin', 'staff'],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試只更新姓名
     */
    public function test_update_name_only()
    {
        $validData = ['name' => 'New Name Only'];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試只更新用戶名
     */
    public function test_update_username_only()
    {
        $validData = ['username' => 'newusername'];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試只更新密碼
     */
    public function test_update_password_only()
    {
        $validData = [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試只更新角色
     */
    public function test_update_roles_only()
    {
        $validData = ['roles' => ['viewer']];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試自定義錯誤訊息
     */
    public function test_custom_error_messages()
    {
        $messages = $this->request->messages();
        
        $this->assertArrayHasKey('name.required', $messages);
        $this->assertArrayHasKey('username.required', $messages);
        $this->assertArrayHasKey('password.required', $messages);
        $this->assertArrayHasKey('username.unique', $messages);
        $this->assertArrayHasKey('password.confirmed', $messages);
        $this->assertArrayHasKey('roles.array', $messages);
        
        $this->assertEquals('姓名不能為空', $messages['name.required']);
        $this->assertEquals('用戶名不能為空', $messages['username.required']);
        $this->assertEquals('密碼不能為空', $messages['password.required']);
    }

    /**
     * 測試自定義屬性名稱
     */
    public function test_custom_attributes()
    {
        $attributes = $this->request->attributes();
        
        $this->assertArrayHasKey('name', $attributes);
        $this->assertArrayHasKey('username', $attributes);
        $this->assertArrayHasKey('password', $attributes);
        $this->assertArrayHasKey('roles', $attributes);
        
        $this->assertEquals('姓名', $attributes['name']);
        $this->assertEquals('用戶名', $attributes['username']);
        $this->assertEquals('密碼', $attributes['password']);
        $this->assertEquals('角色', $attributes['roles']);
    }

    /**
     * 測試 bodyParameters 方法
     */
    public function test_body_parameters()
    {
        $parameters = $this->request->bodyParameters();
        
        $this->assertArrayHasKey('name', $parameters);
        $this->assertArrayHasKey('username', $parameters);
        $this->assertArrayHasKey('password', $parameters);
        $this->assertArrayHasKey('password_confirmation', $parameters);
        $this->assertArrayHasKey('roles', $parameters);
        
        $this->assertEquals('用戶姓名（可選更新）', $parameters['name']['description']);
        $this->assertEquals('用戶帳號（可選更新）', $parameters['username']['description']);
        $this->assertFalse($parameters['password']['required']);
        $this->assertFalse($parameters['password_confirmation']['required']);
    }

    /**
     * 測試邊界值情況
     */
    public function test_boundary_values()
    {
        // 測試最大長度的有效值
        $validData = [
            'name' => str_repeat('a', 255),
            'username' => 'newuser_' . str_repeat('b', 247), // 255 - 8 = 247
            'password' => 'password', // 正好 8 字元
            'password_confirmation' => 'password',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試特殊字元處理
     */
    public function test_special_characters()
    {
        $validData = [
            'name' => 'Test User 測試用戶',
            'username' => 'test_user-123',
            'password' => 'password123!@#',
            'password_confirmation' => 'password123!@#',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試複合驗證失敗情況
     */
    public function test_multiple_validation_failures()
    {
        $invalidData = [
            'name' => '', // 空的姓名
            'username' => str_repeat('a', 256), // 超長的用戶名
            'password' => '123', // 太短的密碼
            'password_confirmation' => '456', // 不匹配的確認密碼
            'roles' => ['invalid_role'], // 無效的角色
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        
        $errors = $validator->errors()->toArray();
        $this->assertArrayHasKey('name', $errors);
        $this->assertArrayHasKey('username', $errors);
        $this->assertArrayHasKey('password', $errors);
        $this->assertArrayHasKey('roles.0', $errors);
    }

    /**
     * 測試所有可能的有效角色
     */
    public function test_all_valid_roles()
    {
        $validData = ['roles' => ['admin', 'staff', 'viewer']];
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試密碼不提供確認時的行為
     */
    public function test_password_without_confirmation()
    {
        $invalidData = ['password' => 'newpassword123'];
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }
}