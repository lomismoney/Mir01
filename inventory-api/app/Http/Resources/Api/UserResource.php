<?php

namespace App\Http\Resources\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
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
            'role' => $this->role, // 新增 'role' 欄位
            'role_display' => $this->getRoleDisplayName(), // 角色顯示名稱
            'is_admin' => (bool) $this->isAdmin(), // 是否為管理員
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'stores' => StoreResource::collection($this->whenLoaded('stores')), // 新增分店關聯
        ];
    }

    /**
     * 獲取角色顯示名稱
     *
     * @return string
     */
    private function getRoleDisplayName(): string
    {
        $roleNames = User::getAvailableRoles();
        return $roleNames[$this->role] ?? $this->role;
    }
}
