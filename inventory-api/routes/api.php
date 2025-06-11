<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AttributeController;
use App\Http\Controllers\Api\V1\AttributeValueController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\PurchaseController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Resources\Api\V1\UserResource;

/**
 * @group Authentication
 * 
 * 使用者登入
 * 
 * 驗證使用者憑證並返回 API Token 用於後續的認證請求。
 * 公開路由，不需要認證即可訪問。
 */
Route::post('/login', [AuthController::class, 'login']);

/**
 * 保護路由群組：需要有效的 API Token 才能訪問
 * 使用 auth:sanctum 中介層保護所有內部路由
 */
Route::middleware('auth:sanctum')->group(function () {
    /**
     * @group Authentication
     * @authenticated
     *
     * 獲取當前已認證的使用者資訊
     * 
     * @apiResource App\Http\Resources\Api\V1\UserResource
     * @apiResourceModel App\Models\User
     */
    Route::get('/user', function (Request $request) {
        return new UserResource($request->user());
    });

    /**
     * @group Authentication
     * @authenticated
     *
     * 使用者登出
     * 
     * 撤銷當前使用者的 API Token，使其失效。
     * 此操作會刪除當前請求使用的 Token，但不會影響該使用者的其他活動 Token。
     */
    Route::post('/logout', [AuthController::class, 'logout']);

    /**
     * 商品管理路由
     * 批量刪除商品路由 - 使用 POST 方法進行語義更明確的批量操作
     */
    Route::post('/products/batch-delete', [ProductController::class, 'destroyMultiple']);
    
    /**
     * 商品資源路由
     * 提供完整的 CRUD 操作 (index, store, show, update, destroy)
     */
    Route::apiResource('products', ProductController::class);

    /**
     * 進貨單管理路由
     * POST /api/purchases - 創建新的進貨單
     */
    Route::post('purchases', [PurchaseController::class, 'store']);

    /**
     * 用戶管理路由
     * 提供完整的用戶 CRUD 操作，受 UserPolicy 權限保護
     * 只有管理員可以管理用戶，且不能刪除自己
     */
    Route::apiResource('users', UserController::class);

    /**
     * 商品分類管理路由
     * 提供完整的分類 CRUD 操作，受 CategoryPolicy 權限保護
     * 只有管理員可以管理分類，支援階層式分類結構
     * 
     * 路由列表：
     * GET    /api/categories        - 獲取所有分類列表
     * POST   /api/categories        - 創建新分類
     * GET    /api/categories/{id}   - 獲取指定分類
     * PUT    /api/categories/{id}   - 更新指定分類
     * DELETE /api/categories/{id}   - 刪除指定分類
     */
    Route::apiResource('categories', CategoryController::class);

    /**
     * 商品屬性管理路由
     * 提供完整的屬性 CRUD 操作，受 AttributePolicy 權限保護
     * 只有管理員可以管理屬性，支援 SPU/SKU 架構的屬性系統
     * 
     * 路由列表：
     * GET    /api/attributes        - 獲取所有屬性列表（含屬性值）
     * POST   /api/attributes        - 創建新屬性
     * GET    /api/attributes/{id}   - 獲取指定屬性（含屬性值）
     * PUT    /api/attributes/{id}   - 更新指定屬性
     * DELETE /api/attributes/{id}   - 刪除指定屬性
     */
    Route::apiResource('attributes', AttributeController::class);

    /**
     * 屬性值管理路由（巢狀資源，使用淺層路由）
     * 提供屬性值的 CRUD 操作，受 AttributePolicy 權限保護
     * 使用 shallow() 建立更簡潔的子資源路由
     * 
     * 路由列表：
     * GET    /api/attributes/{attribute}/values     - 獲取指定屬性的所有值
     * POST   /api/attributes/{attribute}/values     - 為指定屬性創建新值
     * PUT    /api/values/{value}                    - 更新指定屬性值
     * DELETE /api/values/{value}                    - 刪除指定屬性值
     */
    Route::apiResource('attributes.values', AttributeValueController::class)->shallow();
});
 