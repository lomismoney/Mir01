<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AttributeController;
use App\Http\Controllers\Api\AttributeValueController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\UserStoreController;
use App\Http\Resources\Api\UserResource;

/**
 * 健康檢查端點
 * 用於確認 API 服務正常運行
 */
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'message' => 'API is running']);
});

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
     * @apiResource App\Http\Resources\Api\UserResource
     * @apiResourceModel App\Models\User
     */
    Route::get('/user', function (Request $request) {
        return new UserResource($request->user()->load('stores'));
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
     * 商品變體管理路由
     * 提供商品變體的查詢功能
     * 
     * 路由列表：
     * GET    /api/products/variants        - 獲取所有商品變體列表
     * GET    /api/products/variants/{id}   - 獲取指定商品變體
     */
    Route::get('/products/variants', [ProductVariantController::class, 'index']);
    Route::get('/products/variants/{id}', [ProductVariantController::class, 'show']);

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
     * 分店管理路由
     * 提供完整的分店 CRUD 操作，受 StorePolicy 權限保護
     * 只有管理員可以管理分店
     * 
     * 路由列表：
     * GET    /api/stores        - 獲取所有分店列表
     * POST   /api/stores        - 創建新分店
     * GET    /api/stores/{id}   - 獲取指定分店
     * PUT    /api/stores/{id}   - 更新指定分店
     * DELETE /api/stores/{id}   - 刪除指定分店
     */
    Route::apiResource('stores', StoreController::class);
    
    /**
     * 用戶分店管理路由
     * 提供用戶與分店關聯管理，受權限保護
     * 只有管理員可以管理用戶的分店關聯
     * 
     * 路由列表：
     * GET    /api/users/{user}/stores         - 獲取指定用戶的所有分店
     * POST   /api/users/{user}/stores         - 分配分店給指定用戶
     */
    Route::apiResource('users.stores', UserStoreController::class)->only(['index', 'store']);

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

    // 庫存轉移 - 必須放在前面，避免和庫存管理的路由衝突
    Route::get('/inventory/transfers', [App\Http\Controllers\Api\InventoryTransferController::class, 'index']);
    Route::get('/inventory/transfers/{id}', [App\Http\Controllers\Api\InventoryTransferController::class, 'show']);
    Route::post('/inventory/transfers', [App\Http\Controllers\Api\InventoryTransferController::class, 'store']);
    Route::patch('/inventory/transfers/{id}/status', [App\Http\Controllers\Api\InventoryTransferController::class, 'updateStatus']);
    Route::patch('/inventory/transfers/{id}/cancel', [App\Http\Controllers\Api\InventoryTransferController::class, 'cancel']);
    
    // 庫存管理
    Route::get('/inventory', [App\Http\Controllers\Api\InventoryManagementController::class, 'index']);
    Route::get('/inventory/{id}', [App\Http\Controllers\Api\InventoryManagementController::class, 'show']);
    Route::post('/inventory/adjust', [App\Http\Controllers\Api\InventoryManagementController::class, 'adjust']);
    Route::get('/inventory/{id}/history', [App\Http\Controllers\Api\InventoryManagementController::class, 'history']);
    Route::post('/inventory/batch-check', [App\Http\Controllers\Api\InventoryManagementController::class, 'batchCheck']);
});
 