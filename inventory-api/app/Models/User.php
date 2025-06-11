<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // 1. 確保已導入

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; // 2. 確保已使用

    // 角色常數定義
    public const ROLE_ADMIN = 'admin';
    public const ROLE_VIEWER = 'viewer';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'username', // 3. 將 'email' 改為 'username'
        'password',
        'role', // 新增 'role'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'password' => 'hashed',
    ];

    /**
     * 檢查用戶是否為管理員
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * 檢查用戶是否為檢視者
     *
     * @return bool
     */
    public function isViewer(): bool
    {
        return $this->role === self::ROLE_VIEWER;
    }

    /**
     * 檢查用戶是否具有指定角色
     *
     * @param string $role
     * @return bool
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * 獲取所有可用的角色
     *
     * @return array
     */
    public static function getAvailableRoles(): array
    {
        return [
            self::ROLE_ADMIN => '管理員',
            self::ROLE_VIEWER => '檢視者',
        ];
    }
}
