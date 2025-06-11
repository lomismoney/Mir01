<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * 用戶集合資源類
 * 
 * 此類負責格式化用戶列表的 API 響應，
 * 包含分頁信息和用戶角色數據
 * 
 * @apiResourceCollection App\Http\Resources\Api\V1\UserCollection
 * @apiResourceModel App\Models\User
 */
class UserCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total' => $this->collection->count(),
                'roles' => [
                    'admin_count' => $this->collection->where('role', 'admin')->count(),
                    'viewer_count' => $this->collection->where('role', 'viewer')->count(),
                ],
            ],
        ];
    }
} 