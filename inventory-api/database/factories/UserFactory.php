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
            'username' => fake()->unique()->userName(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            // 不再設定 role 字段，角色通過 Spatie Permission 管理
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
        return $this->afterCreating(function (User $user) {
            $user->assignRole(User::ROLE_ADMIN);
        });
    }

    /**
     * 創建具有檢視者角色的用戶
     *
     * @return static
     */
    public function viewer(): static
    {
        return $this->afterCreating(function (User $user) {
            $user->assignRole(User::ROLE_VIEWER);
        });
    }

    /**
     * 創建具有員工角色的用戶
     *
     * @return static
     */
    public function staff(): static
    {
        return $this->afterCreating(function (User $user) {
            $user->assignRole(User::ROLE_STAFF);
        });
    }

    /**
     * 創建具有安裝師傅角色的用戶
     *
     * @return static
     */
    public function installer(): static
    {
        return $this->afterCreating(function (User $user) {
            $user->assignRole(User::ROLE_INSTALLER);
        });
    }

    /**
     * 創建具有指定角色的用戶
     *
     * @param string|array $roles
     * @return static
     */
    public function withRoles($roles): static
    {
        return $this->afterCreating(function (User $user) use ($roles) {
            $user->assignRole($roles);
        });
    }
}
