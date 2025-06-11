<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->userName(), // 將 email 改為 username，並使用 userName() 生成器
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => User::ROLE_VIEWER, // 為工廠生成的用戶設定預設角色為 'viewer'
        ];
    }

    /**
     * 因為我們使用 username 認證，不再需要 email 驗證功能
     * 此方法保留以維持相容性，但不執行任何操作
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            // 不再需要 email_verified_at 欄位
        ]);
    }

    /**
     * 創建具有管理員角色的用戶
     *
     * @return static
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => User::ROLE_ADMIN,
        ]);
    }

    /**
     * 創建具有檢視者角色的用戶
     *
     * @return static
     */
    public function viewer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => User::ROLE_VIEWER,
        ]);
    }
}
