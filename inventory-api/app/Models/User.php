<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // 1. 確保已導入
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles; // 2. 確保已使用

    // 角色常數定義
    public const ROLE_ADMIN = 'admin';
    public const ROLE_STAFF = 'staff';
    public const ROLE_VIEWER = 'viewer';
    public const ROLE_INSTALLER = 'installer';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        // 'role' 字段已廢棄，使用 Spatie Permission 管理角色
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
     * 獲取用戶所屬的分店
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class);
    }

    /**
     * 檢查用戶是否為管理員
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(self::ROLE_ADMIN);
    }

    /**
     * 檢查用戶是否為員工
     * 注意：管理員也具有員工權限
     *
     * @return bool
     */
    public function isStaff(): bool
    {
        return $this->hasAnyRole([self::ROLE_STAFF, self::ROLE_ADMIN]);
    }

    /**
     * 檢查用戶是否為檢視者
     *
     * @return bool
     */
    public function isViewer(): bool
    {
        return $this->hasRole(self::ROLE_VIEWER);
    }

    /**
     * 檢查用戶是否為安裝師傅
     *
     * @return bool
     */
    public function isInstaller(): bool
    {
        return $this->hasRole(self::ROLE_INSTALLER);
    }

    // Spatie Permission 會自動提供 hasRole() 和 hasAnyRole() 方法
    // 不需要覆寫，直接使用 trait 提供的功能

    /**
     * 獲取所有可用的角色
     *
     * @return array
     */
    public static function getAvailableRoles(): array
    {
        return [
            self::ROLE_ADMIN => '管理員',
            self::ROLE_STAFF => '員工',
            self::ROLE_VIEWER => '檢視者',
            self::ROLE_INSTALLER => '安裝師傅',
        ];
    }
}
