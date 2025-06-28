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
use App\Http\Controllers\Api\BatchDeleteProductController;
use App\Http\Controllers\Api\CustomerCheckController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InstallationController;
use App\Http\Controllers\Api\InventoryAdjustmentController;
use App\Http\Controllers\Api\InventoryManagementController;
use App\Http\Controllers\Api\InventoryTimeSeriesController;
use App\Http\Controllers\Api\InventoryTransactionController;
use App\Http\Controllers\Api\InventoryTransferController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemStatusController;
use App\Http\Controllers\Api\ProductImageUploadController;
use App\Http\Controllers\Api\RefundController;

/**
 * 健康檢查端點
 * 用於確認 API 服務正常運行
 */
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'message' => 'API is running']);
});

/**

 * 
 * 使用者登入
 * 
 * 驗證使用者憑證並返回 API Token 用於後續的認證請求。
 * 公開路由，不需要認證即可訪問。
 */
// Route::post('/login', [AuthController::class, 'login']); // 暫時註釋用於隔離測試

/**
 * 保護路由群組：需要有效的 API Token 才能訪問
 * 使用 auth:sanctum 中介層保護所有內部路由
 */
Route::middleware('auth:sanctum')->group(function () {
    /**
     * 獲取當前已認證的使用者資訊
     * 
     * @apiResource App\Http\Resources\Api\UserResource
     * @apiResourceModel App\Models\User
     */
    Route::get('/user', function (Request $request) {
        return new UserResource($request->user()->load('stores'));
    });

    /**

     *
     * 使用者登出
     * 
     * 撤銷當前使用者的 API Token，使其失效。
     * 此操作會刪除當前請求使用的 Token，但不會影響該使用者的其他活動 Token。
     */
    // Route::post('/logout', [AuthController::class, 'logout']); // 暫時註釋用於隔離測試

    /**
     * 商品管理路由
     * 批量刪除商品路由 - 使用 POST 方法進行語義更明確的批量操作
     */
    Route::post('/products/batch-delete', [ProductController::class, 'destroyMultiple']);
    
    /**
     * 商品變體管理路由
     * 提供商品變體的查詢功能
     * 
     * 注意：這些路由必須在 products resource 路由之前定義，
     * 避免 /api/products/{id} 路由將 'variants' 誤解為產品 ID
     * 
     * 路由列表：
     * GET    /api/products/variants        - 獲取所有商品變體列表
     * GET    /api/products/variants/{id}   - 獲取指定商品變體
     */
    Route::get('/products/variants', [ProductVariantController::class, 'index']);
    Route::get('/products/variants/{id}', [ProductVariantController::class, 'show']);
    
    /**
     * 商品圖片上傳路由
     * 使用 Spatie Media Library 處理商品圖片上傳和轉換
     * 
     * 注意：此路由必須在 products resource 路由之前定義，
     * 避免 /api/products/{id} 路由將 'upload-image' 誤解為產品 ID
     * 
     * POST   /api/products/{product}/upload-image   - 為指定商品上傳圖片
     */
    Route::post('/products/{product}/upload-image', [ProductController::class, 'uploadImage']);
    

    
    /**
     * 商品資源路由
     * 提供完整的 CRUD 操作 (index, store, show, update, destroy)
     */
    Route::apiResource('products', ProductController::class)->parameters(['products' => 'product']);

    /**
     * 進貨單管理路由
     * 提供完整的進貨單 CRUD 操作，包含狀態管理功能
     * 
     * 路由列表：
     * GET    /api/purchases                      - 獲取進貨單列表（支援篩選和排序）
     * POST   /api/purchases                      - 創建新的進貨單
     * GET    /api/purchases/{purchase}           - 獲取指定進貨單
     * PUT    /api/purchases/{purchase}           - 更新指定進貨單
     * DELETE /api/purchases/{purchase}           - 刪除指定進貨單
     * PATCH  /api/purchases/{purchase}/status    - 更新進貨單狀態
     * PATCH  /api/purchases/{purchase}/cancel    - 取消進貨單
     */
    Route::apiResource('purchases', PurchaseController::class)->parameters(['purchases' => 'purchase']);
    Route::patch('purchases/{purchase}/status', [PurchaseController::class, 'updateStatus']);
    Route::patch('purchases/{purchase}/cancel', [PurchaseController::class, 'cancel']);

    /**
     * 用戶管理路由
     * 提供完整的用戶 CRUD 操作，受 UserPolicy 權限保護
     * 只有管理員可以管理用戶，且不能刪除自己
     */
    Route::apiResource('users', UserController::class)->parameters(['users' => 'user']);
    
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
    Route::apiResource('stores', StoreController::class)->parameters(['stores' => 'store']);
    
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
    Route::apiResource('categories', CategoryController::class)->parameters(['categories' => 'category']);
    
    /**
     * 批量重新排序分類路由
     * 允許管理員批量更新分類的排序順序和父子關係
     * 支援拖曳排序功能的後端實現
     * 
     * POST   /api/categories/batch-reorder  - 批量更新分類順序
     */
    Route::post('/categories/batch-reorder', [CategoryController::class, 'reorder'])->middleware('auth:sanctum');

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
    Route::apiResource('attributes', AttributeController::class)->parameters(['attributes' => 'attribute']);

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
    Route::get('/inventory/transactions', [App\Http\Controllers\Api\InventoryManagementController::class, 'getAllTransactions']);
    Route::get('/inventory/{id}', [App\Http\Controllers\Api\InventoryManagementController::class, 'show']);
    Route::post('/inventory/adjust', [App\Http\Controllers\Api\InventoryManagementController::class, 'adjust']);
    Route::get('/inventory/{id}/history', [App\Http\Controllers\Api\InventoryManagementController::class, 'history']);
    Route::get('/inventory/sku/{sku}/history', [App\Http\Controllers\Api\InventoryManagementController::class, 'getSkuHistory']);
    Route::post('/inventory/batch-check', [App\Http\Controllers\Api\InventoryManagementController::class, 'batchCheck']);

    /**
     * 客戶管理資源路由
     * 提供完整的客戶 CRUD 操作，支援搜尋和篩選功能
     * 
     * 路由列表：
     * GET    /api/customers/check-existence  - 檢查客戶名稱是否存在
     * GET    /api/customers        - 獲取客戶列表（支援搜尋和日期篩選）
     * POST   /api/customers        - 創建新客戶
     * GET    /api/customers/{id}   - 獲取指定客戶
     * PUT    /api/customers/{id}   - 更新指定客戶
     * DELETE /api/customers/{id}   - 刪除指定客戶
     */
    Route::get('/customers/check-existence', [App\Http\Controllers\Api\CustomerController::class, 'checkExistence']);
    Route::apiResource('customers', App\Http\Controllers\Api\CustomerController::class)->parameters(['customers' => 'customer']);

    /**
     * 訂單批量操作路由
     * 提供訂單批量刪除和狀態更新功能，使用 POST 方法進行語義更明確的批量操作
     * 
     * 路由列表：
     * POST   /api/orders/batch-delete          - 批量刪除訂單
     * POST   /api/orders/batch-update-status   - 批量更新訂單狀態
     */
    Route::post('/orders/batch-delete', [App\Http\Controllers\Api\OrderController::class, 'destroyMultiple']);
    Route::post('/orders/batch-update-status', [App\Http\Controllers\Api\OrderController::class, 'updateMultipleStatus']);

    /**
     * 訂單管理資源路由
     * 提供完整的訂單 CRUD 操作，支援多維度篩選功能
     * 
     * 路由列表：
     * GET    /api/orders        - 獲取訂單列表（支援訂單號/客戶名稱搜尋、狀態篩選、日期範圍篩選）
     * POST   /api/orders        - 創建新訂單
     * GET    /api/orders/{id}   - 獲取指定訂單詳情
     * PUT    /api/orders/{id}   - 更新指定訂單
     * DELETE /api/orders/{id}   - 刪除指定訂單
     */
    Route::apiResource('orders', App\Http\Controllers\Api\OrderController::class)->parameters(['orders' => 'order']);
    
    /**
     * 訂單狀態管理路由
     * 提供訂單狀態變更的專用端點
     * 
     * 路由列表：
     * POST   /api/orders/{order}/confirm-payment   - 確認訂單付款
     * POST   /api/orders/{order}/add-payment       - 新增部分付款記錄
     * POST   /api/orders/{order}/create-shipment   - 創建訂單出貨記錄
     */
    Route::post('/orders/{order}/confirm-payment', [App\Http\Controllers\Api\OrderController::class, 'confirmPayment']);
    Route::post('/orders/{order}/add-payment', [App\Http\Controllers\Api\OrderController::class, 'addPayment']);
    Route::post('/orders/{order}/create-shipment', [App\Http\Controllers\Api\OrderController::class, 'createShipment']);
    Route::post('/orders/{order}/refunds', [App\Http\Controllers\Api\OrderController::class, 'createRefund']);
    
    /**
     * 訂單項目管理路由
     * 提供訂單項目狀態管理的專用端點
     * 
     * 路由列表：
     * PATCH  /api/order-items/{order_item}/status  - 更新訂單項目狀態
     */
    Route::patch('/order-items/{order_item}/status', [App\Http\Controllers\Api\OrderItemController::class, 'updateStatus']);
    
    /**
     * 訂單取消路由
     * 提供訂單取消功能，並自動返還庫存
     * 
     * 路由列表：
     * POST   /api/orders/{order}/cancel  - 取消訂單
     */
    Route::post('/orders/{order}/cancel', [App\Http\Controllers\Api\OrderController::class, 'cancel']);
    
    /**
     * 報表與分析路由
     * 提供各種統計數據和分析報表，支援數據可視化
     * 
     * 路由列表：
     * GET    /api/reports/inventory-time-series  - 獲取商品變體的庫存時序數據
     */
    Route::prefix('reports')->group(function () {
        Route::get('/inventory-time-series', [App\Http\Controllers\Api\ReportController::class, 'inventoryTimeSeries']);
    });

    /**
     * 安裝管理路由
     * 提供安裝單的創建、管理和狀態追蹤功能，支援與訂單系統的鬆耦合整合
     * 
     * 路由列表：
     * GET    /api/installations                            - 獲取安裝單列表（支援狀態/師傅/日期篩選）
     * POST   /api/installations                            - 創建新安裝單
     * POST   /api/installations/create-from-order          - 從訂單創建安裝單
     * GET    /api/installations/schedule                   - 獲取安裝師傅的行程
     * GET    /api/installations/{installation}             - 獲取指定安裝單詳情
     * PUT    /api/installations/{installation}             - 更新指定安裝單
     * DELETE /api/installations/{installation}             - 刪除指定安裝單
     * POST   /api/installations/{installation}/assign      - 分配安裝師傅
     * POST   /api/installations/{installation}/status      - 更新安裝單狀態
     */
    Route::post('/installations/create-from-order', [App\Http\Controllers\Api\InstallationController::class, 'createFromOrder']);
    Route::get('/installations/schedule', [App\Http\Controllers\Api\InstallationController::class, 'getSchedule']);
    Route::apiResource('installations', App\Http\Controllers\Api\InstallationController::class)->parameters(['installations' => 'installation']);
    Route::post('/installations/{installation}/assign', [App\Http\Controllers\Api\InstallationController::class, 'assignInstaller']);
    Route::post('/installations/{installation}/status', [App\Http\Controllers\Api\InstallationController::class, 'updateStatus']);
});
 