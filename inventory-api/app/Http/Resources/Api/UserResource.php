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
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'roles' => $this->getRoleNames()->toArray(), // 用戶的所有角色
            'roles_display' => $this->getRolesDisplayNames(), // 角色顯示名稱
            'is_admin' => $this->hasRole('admin'), // 是否有管理員角色
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'stores' => StoreResource::collection($this->whenLoaded('stores')), // 分店關聯
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
        
        return $this->getRoleNames()
            ->map(function ($role) use ($availableRoles) {
                return $availableRoles[$role] ?? $role;
            })
            ->toArray();
    }
}
