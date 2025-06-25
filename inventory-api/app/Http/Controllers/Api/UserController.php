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
     * 顯示用戶列表
     *
     * 支援對 name 和 username 欄位進行部分匹配篩選。
     * @group 用戶管理
     * @authenticated
     * @queryParam filter[name] string 對用戶名稱進行模糊搜尋。 Example: admin
     * @queryParam filter[username] string 對用戶帳號進行模糊搜尋。 Example: superadmin
     * @queryParam filter[search] string 對名稱或帳號進行全域模糊搜尋。 Example: admin
     * @queryParam user_name string 按用戶名稱篩選
     * @queryParam email string 按電子郵件篩選
     * @queryParam per_page integer 每頁項目數量，預設 15
     * 
     * @response 200 scenario="成功獲取用戶列表" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "name": "用戶名稱",
     *       "email": "user@example.com",
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z"
     *     }
     *   ],
     *   "meta": {
     *     "current_page": 1,
     *     "per_page": 15,
     *     "total": 100
     *   }
     * }
     */
    public function index()
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理
        
        $users = QueryBuilder::for(User::class)
            ->allowedFilters([
                'name', 'username',
                AllowedFilter::custom('search', new UserSearchFilter()),
            ])
            ->with('stores')
            ->paginate(15);

        return UserResource::collection($users);
    }

    /**
     * 建立新用戶
     * 
     * 接收用戶創建請求，進行驗證後建立新用戶帳號。
     * 自動將密碼進行 bcrypt 雜湊處理確保安全性。
     * 權限檢查：需要通過 UserPolicy::create() 方法（僅管理員可執行）
     * 
     * @param \App\Http\Requests\Api\StoreUserRequest $request 已驗證的請求資料
     * @bodyParam name string required 用戶名稱
     * @bodyParam email string required 電子郵件地址
     * @bodyParam password string required 密碼
     * 
     * @response 201 scenario="用戶創建成功" {
     *   "data": {
     *     "id": 1,
     *     "name": "新用戶",
     *     "email": "newuser@example.com",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     * @return \App\Http\Resources\Api\UserResource 新建立的用戶資源
     */
    public function store(StoreUserRequest $request)
    {
        // 取得已通過驗證的資料
        $validatedData = $request->validated();
        
        // 建立用戶前必須對密碼進行雜湊處理（安全性要求）
        $validatedData['password'] = Hash::make($validatedData['password']);
        
        // 建立新用戶
        $user = User::create($validatedData);

        // 返回格式化的用戶資源
        return new UserResource($user);
    }

    /**
     * 顯示指定用戶
     * 
     * 根據用戶 ID 返回特定用戶的完整資料。
     * 權限檢查：需要通過 UserPolicy::view() 方法（僅管理員可存取）
     * 
     * @param \App\Models\User $user 要查看的用戶模型實例（透過路由模型綁定自動解析）
     * @urlParam user integer required 用戶的 ID。 Example: 1
     * @urlParam id integer required 用戶的 ID。 Example: 1
     * 
     * @response 200 scenario="用戶詳情" {
     *   "data": {
     *     "id": 1,
     *     "name": "用戶名稱",
     *     "email": "user@example.com",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     * @return \App\Http\Resources\Api\UserResource 用戶資源
     */
    public function show(User $user)
    {
        // 載入使用者所屬的分店資訊
        $user->load('stores');
        
        // 返回格式化的單一用戶資料
        return new UserResource($user);
    }

    /**
     * 更新指定用戶
     * 
     * 接收用戶更新請求，進行驗證後更新用戶資料。
     * 支援部分更新（只更新提供的欄位）。
     * 如果請求中包含密碼，會自動進行 bcrypt 雜湊處理。
     * 權限檢查：需要通過 UserPolicy::update() 方法（僅管理員可執行）
     * 
     * @param \App\Http\Requests\Api\UpdateUserRequest $request 已驗證的請求資料
     * @param \App\Models\User $user 要更新的用戶模型實例（透過路由模型綁定自動解析）
     * @urlParam user integer required 用戶的 ID。 Example: 1
     * @bodyParam name string required 用戶名稱
     * @bodyParam email string required 電子郵件地址
     * 
     * @response 200 scenario="用戶更新成功" {
     *   "data": {
     *     "id": 1,
     *     "name": "更新後的用戶名稱",
     *     "email": "updated@example.com",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     * @return \App\Http\Resources\Api\UserResource 更新後的用戶資源
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        // 取得已通過驗證的資料
        $validatedData = $request->validated();

        // 如果請求中包含了新密碼，則對其進行雜湊處理
        if (isset($validatedData['password'])) {
            $validatedData['password'] = Hash::make($validatedData['password']);
        }
        
        // 更新用戶資料（只更新提供的欄位）
        $user->update($validatedData);

        // 返回更新後的用戶資源
        return new UserResource($user);
    }

    /**
     * 刪除指定用戶
     * 
     * 執行用戶刪除操作，成功後返回 204 No Content 回應。
     * 權限檢查：需要通過 UserPolicy::delete() 方法
     * 
     * 安全機制：
     * - 只有管理員可以刪除用戶
     * - 管理員不能刪除自己的帳號（在 UserPolicy 中檢查）
     * - 檢視者無法執行刪除操作
     * 
     * @param \App\Models\User $user 要刪除的用戶模型實例（透過路由模型綁定自動解析）
     * @urlParam user integer required 用戶的 ID。 Example: 1
     * @response 204
     * @return \Illuminate\Http\Response 204 No Content 回應
     */
    public function destroy(User $user)
    {
        // 執行用戶刪除操作
        $user->delete();
        
        // 返回 204 No Content 回應，表示成功刪除且無需返回內容
        return response()->noContent();
    }
}
