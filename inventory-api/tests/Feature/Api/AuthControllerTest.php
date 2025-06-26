<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

class AuthControllerTest extends TestCase
{
    use WithFaker, RefreshDatabase;
    
    /** @test */
    public function user_can_login_with_valid_credentials()
    {
        // 創建測試用戶
        $password = 'test-password';
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => Hash::make($password),
        ]);
        $user->assignRole('admin');
        
        // 準備登入數據
        $loginData = [
            'username' => 'testuser',
            'password' => $password
        ];
        
        // 發送登入請求
        $response = $this->postJson('/api/login', $loginData);
        
        // 檢查響應狀態
        $response->assertStatus(200);
        
        // 檢查響應結構
        $response->assertJson(function (AssertableJson $json) use ($user) {
            $json->has('user')
                 ->has('token')
                 ->where('user.id', $user->id)
                 ->where('user.username', $user->username)
                 ->where('user.roles', ['admin'])
                 ->where('user.is_admin', true)
                 ->etc();
        });
        
        // 檢查Token是否存在
        $this->assertNotEmpty($response->json('token'));
        
        // 檢查數據庫中是否有Token記錄
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => User::class,
        ]);
    }
    
    /** @test */
    public function user_cannot_login_with_invalid_username()
    {
        // 創建測試用戶
        User::factory()->create([
            'username' => 'testuser',
            'password' => Hash::make('password')
        ]);
        
        // 準備錯誤的登入數據
        $loginData = [
            'username' => 'wronguser',
            'password' => 'password'
        ];
        
        // 發送登入請求
        $response = $this->postJson('/api/login', $loginData);
        
        // 檢查響應狀態
        $response->assertStatus(422);
        
        // 檢查錯誤訊息
        $response->assertJson([
            'message' => '您提供的憑證不正確。',
            'errors' => [
                'username' => ['您提供的憑證不正確。']
            ]
        ]);
    }
    
    /** @test */
    public function user_cannot_login_with_invalid_password()
    {
        // 創建測試用戶
        User::factory()->create([
            'username' => 'testuser',
            'password' => Hash::make('correct-password')
        ]);
        
        // 準備錯誤的登入數據
        $loginData = [
            'username' => 'testuser',
            'password' => 'wrong-password'
        ];
        
        // 發送登入請求
        $response = $this->postJson('/api/login', $loginData);
        
        // 檢查響應狀態
        $response->assertStatus(422);
        
        // 檢查錯誤訊息
        $response->assertJson([
            'message' => '您提供的憑證不正確。',
            'errors' => [
                'username' => ['您提供的憑證不正確。']
            ]
        ]);
    }
    
    /** @test */
    public function login_requires_username_and_password()
    {
        // 測試缺少username
        $response = $this->postJson('/api/login', [
            'password' => 'password'
        ]);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['username']);
        
        // 測試缺少password
        $response = $this->postJson('/api/login', [
            'username' => 'testuser'
        ]);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
        
        // 測試兩個字段都缺少
        $response = $this->postJson('/api/login', []);
        
        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['username', 'password']);
    }
    
    /** @test */
    public function authenticated_user_can_logout()
    {
        // 創建並認證用戶
        $user = User::factory()->create();
        
        // 使用Sanctum創建Token
        Sanctum::actingAs($user);
        
        // 發送登出請求
        $response = $this->postJson('/api/logout');
        
        // 檢查響應狀態 (204 No Content)
        $response->assertStatus(204);
        
        // 檢查響應內容為空
        $this->assertEmpty($response->getContent());
    }
    
    /** @test */
    public function unauthenticated_user_cannot_logout()
    {
        // 發送登出請求（未認證）
        $response = $this->postJson('/api/logout');
        
        // 檢查響應狀態 (401 Unauthorized)
        $response->assertStatus(401);
    }
} 