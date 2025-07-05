<?php

namespace App\Http\Controllers\Api;

use App\Filters\UserSearchFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreUserRequest;
use App\Http\Requests\Api\UpdateUserRequest;
use App\Http\Resources\Api\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * 用戶管理控制器
 * 
 * 提供用戶的完整 CRUD 操作，包含：
 * - 查看用戶列表（支援分頁、搜尋、排序）
 * - 查看單一用戶詳情
 * - 建立新用戶帳號
 * - 更新用戶資料（支援部分更新）
 * - 刪除用戶帳號
 * 
 * 所有操作都受 UserPolicy 嚴格保護：
 * - 只有管理員可以管理用戶
 * - 管理員不能刪除自己的帳號
 * - 檢視者無法存取任何用戶管理功能
 * 
 * @group 用戶管理
 * @authenticated
 */
class UserController extends Controller
{
    /**
     * 建構函式：設定權限檢查
     * 
     * 使用 authorizeResource 自動將控制器方法與 UserPolicy 中的
     * 對應權限方法進行綁定：
     * - index() → viewAny()
     * - store() → create()
     * - show() → view()
     * - update() → update()
     * - destroy() → delete()
     */
    public function __construct()
    {
        // 對所有資源路由方法自動應用 UserPolicy
        $this->authorizeResource(User::class, 'user');
    }

    /**
     * Display a listing of users
     * 
     * @group 用戶管理
     * @authenticated
     * @summary 獲取用戶列表
     * @description 顯示系統中所有用戶的分頁列表，支援多種篩選和搜尋功能。
     * 
     * **篩選功能：**
     * - 按用戶名稱模糊搜尋
     * - 按用戶帳號模糊搜尋  
     * - 按角色篩選
     * - 全域搜尋（同時搜尋名稱和帳號）
     * 
     * **返回數據包含：**
     * - 用戶基本資訊（ID、名稱、帳號）
     * - 角色資訊和權限狀態
     * - 關聯的門市資料
     * - 分頁元數據
     * 
     * @queryParam filter[name] string 對用戶名稱進行模糊搜尋 Example: admin
     * @queryParam filter[username] string 對用戶帳號進行模糊搜尋 Example: superadmin
     * @queryParam filter[search] string 對名稱或帳號進行全域模糊搜尋 Example: admin
     * @queryParam filter[role] string 按角色篩選用戶 Example: installer
     * @queryParam per_page integer 每頁項目數量，預設 15 Example: 15
     * @queryParam page integer 頁數 Example: 1
     * 
     * @apiResourceCollection App\Http\Resources\Api\UserResource
     * @apiResourceModel App\Models\User with=stores,roles
     * 
     * @response 200 scenario="成功獲取用戶列表" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "name": "用戶名稱",
     *       "username": "admin",
     *       "roles": ["admin"],
     *       "role_display": "管理員",
     *       "is_admin": true,
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z",
     *       "stores": [{"id": 1, "name": "總店"}]
     *     }
     *   ],
     *   "meta": {
     *     "current_page": 1,
     *     "per_page": 15,
     *     "total": 100,
     *     "last_page": 7
     *   },
     *   "links": {
     *     "first": "http://localhost/api/users?page=1",
     *     "last": "http://localhost/api/users?page=7",
     *     "prev": null,
     *     "next": "http://localhost/api/users?page=2"
     *   }
     * }
     */
    public function index(Request $request)
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理
        
        $query = QueryBuilder::for(User::class)
            ->allowedFilters([
                'name', 
                'username',
                AllowedFilter::custom('search', new UserSearchFilter()),
                // 添加角色篩選器
                AllowedFilter::callback('role', function ($query, $value) {
                    $query->whereHas('roles', function ($q) use ($value) {
                        $q->where('name', $value);
                    });
                }),
            ])
            ->with('stores');
            
        $users = $query->paginate(15);

        return UserResource::collection($users);
    }

    /**
     * Create a new user
     * 
     * @group 用戶管理
     * @authenticated
     * @summary 建立新用戶
     * @description 接收用戶創建請求，進行驗證後建立新用戶帳號。自動將密碼進行 bcrypt 雜湊處理確保安全性。
     * 
     * @bodyParam name string required 用戶名稱 Example: 新用戶
     * @bodyParam username string required 用戶帳號（唯一） Example: newuser
     * @bodyParam password string required 密碼（至少8個字元） Example: password123
     * @bodyParam password_confirmation string required 密碼確認（必須與密碼相同） Example: password123
     * @bodyParam roles array 角色陣列 Example: ["viewer"]
     * 
     * @apiResource App\Http\Resources\Api\UserResource
     * @apiResourceModel App\Models\User with=stores,roles
     */
    public function store(StoreUserRequest $request)
    {
        // 取得已通過驗證的資料
        $validatedData = $request->validated();
        
        // 建立用戶前必須對密碼進行雜湊處理（安全性要求）
        $validatedData['password'] = Hash::make($validatedData['password']);
        
        // 取出角色資料（不存入 users 表）
        $roles = $validatedData['roles'] ?? [];
        unset($validatedData['roles']);
        
        // 建立新用戶
        $user = User::create($validatedData);
        
        // 如果有指定角色，分配給用戶
        if (!empty($roles)) {
            $user->syncRoles($roles);
        }

        // 返回格式化的用戶資源
        return new UserResource($user);
    }

    /**
     * Display specified user
     * 
     * @group 用戶管理
     * @authenticated
     * @summary 查看指定用戶
     * @description 根據用戶 ID 返回特定用戶的完整資料，包含關聯的門市和角色資訊。
     * 
     * @urlParam user integer required 用戶ID Example: 1
     * 
     * @apiResource App\Http\Resources\Api\UserResource
     * @apiResourceModel App\Models\User with=stores,roles
     */
    public function show(User $user)
    {
        // 載入使用者所屬的分店資訊
        $user->load('stores');
        
        // 返回格式化的單一用戶資料
        return new UserResource($user);
    }

    /**
     * Update specified user
     * 
     * @group 用戶管理
     * @authenticated
     * @summary 更新指定用戶
     * @description 接收用戶更新請求，進行驗證後更新用戶資料。支援部分更新，密碼會自動雜湊處理。
     * 
     * @urlParam user integer required 用戶ID Example: 1
     * 
     * @bodyParam name string 用戶名稱 Example: 更新後的用戶名稱
     * @bodyParam username string 用戶帳號 Example: updateduser
     * @bodyParam password string 用戶密碼（可選） Example: newpassword123
     * @bodyParam password_confirmation string 密碼確認（當提供密碼時必需） Example: newpassword123
     * @bodyParam roles array 角色陣列 Example: ["admin"]
     * @bodyParam email string 電子郵件地址 Example: user@example.com
     * 
     * @apiResource App\Http\Resources\Api\UserResource
     * @apiResourceModel App\Models\User with=stores,roles
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        // 取得已通過驗證的資料
        $validatedData = $request->validated();

        // 如果請求中包含了新密碼，則對其進行雜湊處理
        if (isset($validatedData['password'])) {
            $validatedData['password'] = Hash::make($validatedData['password']);
        }
        
        // 如果請求中包含角色，更新角色
        if (isset($validatedData['roles'])) {
            $user->syncRoles($validatedData['roles']);
            unset($validatedData['roles']);
        }
        
        // 更新用戶資料（只更新提供的欄位）
        $user->update($validatedData);

        // 返回更新後的用戶資源
        return new UserResource($user);
    }

    /**
     * Delete specified user
     * 
     * @group 用戶管理
     * @authenticated
     * @summary 刪除指定用戶
     * @description 執行用戶刪除操作。安全機制：管理員不能刪除自己的帳號。
     * 
     * @urlParam user integer required 用戶ID Example: 1
     * 
     * @response 204 scenario="刪除成功" ""
     */
    public function destroy(User $user)
    {
        // 執行用戶刪除操作
        $user->delete();
        
        // 返回 204 No Content 回應，表示成功刪除且無需返回內容
        return response()->noContent();
    }
}
