<?php

namespace App\Http\Resources\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\User
 * 
 * 用戶資源類
 * 
 * 此類負責格式化單個用戶的 API 響應，
 * 包含用戶基本信息和角色數據
 * 
 * @apiResource App\Http\Resources\Api\UserResource
 * @apiResourceModel App\Models\User
 * 
 * @property int $id
 * @property string $name
 * @property string $username
 * @property array<string> $roles
 * @property array<string> $roles_display
 * @property bool $is_admin
 * @property string $created_at
 * @property string $updated_at
 * @property \App\Http\Resources\Api\StoreResource[]|null $stores
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param Request $request
     * @return array<string, mixed>
     * 
     * @apiResponse {
     *   "id": 1,
     *   "name": "管理員",
     *   "username": "admin",
     *   "roles": ["admin", "staff"],
     *   "roles_display": ["管理員", "員工"],
     *   "is_admin": true,
     *   "created_at": "2024-01-01T00:00:00.000000Z",
     *   "updated_at": "2024-01-01T00:00:00.000000Z",
     *   "stores": []
     * }
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'roles' => $this->resource->getRoleNames()->toArray(), // 用戶的所有角色
            'roles_display' => $this->getRolesDisplayNames(), // 角色顯示名稱
            'is_admin' => $this->hasRole('admin'), // 是否有管理員角色
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'stores' => $this->when(
                $this->relationLoaded('stores'),
                fn() => StoreResource::collection($this->stores),
                []
            ), // 分店關聯
        ];
    }

    /**
     * 獲取角色顯示名稱陣列
     *
     * @return array
     */
    private function getRolesDisplayNames(): array
    {
        $availableRoles = User::getAvailableRoles();
        
        return $this->resource->getRoleNames()
            ->map(function ($role) use ($availableRoles) {
                return $availableRoles[$role] ?? $role;
            })
            ->toArray();
    }
}
