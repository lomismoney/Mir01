<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCustomerRequest;
use App\Http\Requests\Api\UpdateCustomerRequest;
use App\Http\Requests\Api\DestroyMultipleCustomersRequest;
use App\Http\Resources\Api\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * 客戶服務實例
     *
     * @var CustomerService
     */
    protected $customerService;

    /**
     * 建構函數 - 注入 CustomerService 並設置資源授權
     *
     * @param CustomerService $customerService
     */
    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
        
        // 🔐 使用 authorizeResource 自動將控制器方法與 CustomerPolicy 中的
        // viewAny、view、create、update、delete 方法進行映射
        $this->authorizeResource(Customer::class, 'customer');
    }
    /**
     * @group 客戶管理
     * @authenticated
     * @summary 獲取客戶列表
     * @queryParam search string 關鍵字搜尋，將匹配姓名、電話、統一編號。Example: 設計公司
     * @queryParam start_date string 按創建日期篩選的開始日期 (格式: Y-m-d)。Example: 2025-01-01
     * @queryParam end_date string 按創建日期篩選的結束日期 (格式: Y-m-d)。Example: 2025-06-18
     * 
     * @apiResourceCollection \App\Http\Resources\Api\CustomerResource
     * @apiResourceModel \App\Models\Customer
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        // 驗證請求參數
        $request->validate([
            'search'     => 'nullable|string',
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date'   => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        // 3. 構建查詢
        $customers = Customer::query()
            // 預加載預設地址，防止 N+1 問題
            ->with('defaultAddress')
            // 添加統計數據計算
            ->withCount(['orders', 'addresses'])
            // 條件化查詢：當請求中存在對應參數時才執行
            ->when($request->filled('search'), function ($query) use ($request) {
                $searchTerm = '%' . $request->input('search') . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', $searchTerm)
                      ->orWhere('phone', 'like', $searchTerm)
                      ->orWhere('tax_id', 'like', $searchTerm);
                });
            })
            ->when($request->filled('start_date'), function ($query) use ($request) {
                $query->whereDate('created_at', '>=', $request->input('start_date'));
            })
            ->when($request->filled('end_date'), function ($query) use ($request) {
                $query->whereDate('created_at', '<=', $request->input('end_date'));
            })
            // 4. 排序與分頁
            ->latest() // 默認按創建時間倒序
            ->paginate(15); // 每頁 15 筆

        // 5. 返回標準化的 API 資源集合
        return CustomerResource::collection($customers);
    }

    /**
     * @group 客戶管理
     * @authenticated
     * @summary 創建新客戶
     * @bodyParam name string required 客戶名稱或公司抬頭. Example: 測試客戶
     * @bodyParam phone string 手機號碼. Example: 0987654321
     * @bodyParam email string 電子郵件地址. Example: customer@example.com
     * @bodyParam is_company boolean required 是否為公司戶. Example: false
     * @bodyParam tax_id string 統一編號 (is_company為true時必填). Example: 12345678
     * @bodyParam industry_type string required 行業別. Example: 設計師
     * @bodyParam payment_type string required 付款類別. Example: 現金付款
     * @bodyParam contact_address string 主要聯絡地址. Example: 台北市信義區
     * @bodyParam addresses array nullable 運送地址列表.
     * @bodyParam addresses.*.address string required 地址內容. Example: 台北市大安區
     * @bodyParam addresses.*.is_default boolean required 是否為預設地址. Example: true
     * 
     * @apiResource \App\Http\Resources\Api\CustomerResource
     * @apiResourceModel \App\Models\Customer
     * @response 201 scenario="客戶創建成功" {
     *   "data": {
     *     "id": 1,
     *     "name": "測試客戶",
     *     "phone": "0987654321",
     *     "email": "customer@example.com",
     *     "is_company": false,
     *     "tax_id": null,
     *     "industry_type": "設計師",
     *     "payment_type": "現金付款",
     *     "contact_address": "台北市信義區",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        try {
            // 授權檢查已由 __construct 中的 authorizeResource 處理

            // 將驗證過的數據傳遞給 Service 層處理
            $customer = $this->customerService->createCustomer($request->validated());

            // 3. 返回標準化的 API 資源，並附帶 201 Created 狀態碼
            return (new CustomerResource($customer))
                ->response()
                ->setStatusCode(201);

        } catch (\Illuminate\Database\QueryException $e) {
            // 資料庫錯誤處理
            if ($e->getCode() === '23000') {
                return response()->json([
                    'message' => '資料驗證失敗',
                    'error' => '電話號碼或統一編號已存在',
                ], 422);
            }

            // 其他資料庫錯誤
            return response()->json([
                'message' => '資料庫操作失敗',
                'error' => '請稍後再試或聯繫系統管理員',
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '客戶創建失敗',
                'error' => '系統錯誤，請稍後再試',
            ], 500);
        }
    }

    /**
     * @group 客戶管理
     * @authenticated
     * @summary 獲取客戶詳情
     * @description 顯示指定客戶的詳細資訊，包含所有關聯的地址資料。
     * 
     * @urlParam customer integer required 客戶ID。 Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\CustomerResource
     * @apiResourceModel \App\Models\Customer
     */
    public function show(Customer $customer): CustomerResource
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        // 預加載所有需要的關聯數據，以優化性能
        $customer->load(['addresses', 'defaultAddress']);
        $customer->loadCount(['orders', 'addresses']);

        // 3. 返回標準化的單一資源
        return new CustomerResource($customer);
    }

    /**
     * @group 客戶管理
     * @authenticated
     * @summary 更新客戶資訊
     * @description 更新指定客戶的基本資訊和地址列表，支援複雜的地址管理操作。
     * 
     * @urlParam customer integer required 客戶ID。 Example: 1
     * @bodyParam name string required 客戶名稱或公司抬頭. Example: 測試客戶（已更新）
     * @bodyParam phone string 手機號碼. Example: 0987654321
     * @bodyParam email string 電子郵件地址. Example: customer@example.com
     * @bodyParam is_company boolean required 是否為公司戶. Example: false
     * @bodyParam tax_id string 統一編號 (is_company為true時必填). Example: 12345678
     * @bodyParam industry_type string required 行業別. Example: 設計師
     * @bodyParam payment_type string required 付款類別. Example: 現金付款
     * @bodyParam contact_address string 主要聯絡地址. Example: 台北市信義區
     * @bodyParam addresses array nullable 運送地址列表.
     * @bodyParam addresses.*.id integer nullable 地址 ID (更新現有地址時必填). Example: 1
     * @bodyParam addresses.*.address string required 地址內容. Example: 台北市大安區
     * @bodyParam addresses.*.is_default boolean required 是否為預設地址. Example: true
     * 
     * @apiResource \App\Http\Resources\Api\CustomerResource
     * @apiResourceModel \App\Models\Customer
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        try {
            // 授權檢查已由 __construct 中的 authorizeResource 處理

            // 將驗證過的數據傳遞給 Service 層處理
            $updatedCustomer = $this->customerService->updateCustomer($customer, $request->validated());

            // 3. 返回標準化的單一資源
            return (new CustomerResource($updatedCustomer))->response();

        } catch (\Illuminate\Database\QueryException $e) {
            // 資料庫錯誤處理
            if ($e->getCode() === '23000') {
                return response()->json([
                    'message' => '資料驗證失敗',
                    'error' => '電話號碼或統一編號已存在',
                ], 422);
            }

            // 其他資料庫錯誤
            return response()->json([
                'message' => '資料庫操作失敗',
                'error' => '請稍後再試或聯繫系統管理員',
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '客戶更新失敗',
                'error' => '系統錯誤，請稍後再試',
            ], 500);
        }
    }

    /**
     * @group 客戶管理
     * @authenticated
     * @summary 刪除客戶
     * @description 刪除指定客戶及其相關的地址資料。
     * 
     * @urlParam customer integer required 客戶ID。 Example: 1
     * 
     * @response 204 scenario="刪除成功"
     */
    public function destroy(Customer $customer): Response
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        // 執行刪除操作
        $customer->delete();

        // 3. 返回 204 No Content 響應，這是 RESTful API 中成功刪除操作的標準實踐
        return response()->noContent();
    }

    /**
     * @group 客戶管理
     * @authenticated
     * @summary 批量刪除客戶
     * @description 批量刪除指定的客戶，在刪除前會檢查是否有相關的訂單記錄。
     * 如果客戶有相關的訂單，則不允許刪除。
     * 
     * @bodyParam ids integer[] required 要刪除的客戶 ID 陣列。 Example: [1, 2, 3]
     * 
     * @response 204 scenario="刪除成功"
     * @response 422 scenario="客戶有相關訂單" {"message": "以下客戶有相關訂單，無法刪除", "customers_with_orders": [{"id": 1, "name": "客戶A", "orders_count": 3}]}
     * @response 404 scenario="部分客戶不存在" {"message": "部分指定的客戶不存在", "invalid_ids": [999]}
     */
    public function destroyMultiple(DestroyMultipleCustomersRequest $request): JsonResponse
    {
        // 權限檢查 - 檢查是否有批量刪除客戶的權限
        $this->authorize('deleteMultiple', Customer::class);
        
        $validatedData = $request->validated();
        
        // 獲取要刪除的 ID 並轉換為整數陣列
        $ids = array_map('intval', $validatedData['ids']);
        
        try {
            // 使用事務確保操作的原子性
            return DB::transaction(function () use ($ids) {
                // 檢查是否有客戶存在相關聯的訂單
                $customersWithOrders = Customer::whereIn('id', $ids)
                    ->withCount('orders')
                    ->having('orders_count', '>', 0)
                    ->get(['id', 'name', 'orders_count']);

                // 如果有客戶存在相關訂單，返回錯誤響應
                if ($customersWithOrders->isNotEmpty()) {
                    return response()->json([
                        'message' => '以下客戶有相關訂單，無法刪除',
                        'customers_with_orders' => $customersWithOrders->map(function ($customer) {
                            return [
                                'id' => $customer->id,
                                'name' => $customer->name,
                                'orders_count' => $customer->orders_count,
                            ];
                        })->toArray(),
                    ], 422);
                }

                // 檢查所有指定的客戶是否都存在
                $existingCustomers = Customer::whereIn('id', $ids)->pluck('id')->toArray();
                $invalidIds = array_diff($ids, $existingCustomers);

                if (!empty($invalidIds)) {
                    return response()->json([
                        'message' => '部分指定的客戶不存在',
                        'invalid_ids' => $invalidIds,
                    ], 404);
                }

                // 執行批量刪除
                $deletedCount = Customer::whereIn('id', $ids)->delete();

                // 返回成功響應
                return response()->json([
                    'message' => "成功刪除 {$deletedCount} 個客戶",
                    'deleted_count' => $deletedCount,
                ], 200);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => '批量刪除失敗',
                'error' => '系統錯誤，請稍後再試',
            ], 500);
        }
    }

    /**
     * @group 客戶管理
     * @authenticated
     * @summary 檢查客戶名稱是否存在
     * @queryParam name string required 要檢查的客戶名稱。Example: 測試客戶
     * @response 200 scenario="檢查成功" {"exists": true}
     * @response 200 scenario="名稱不存在" {"exists": false}
     */
    public function checkExistence(Request $request): JsonResponse
    {
        // 1. 權限驗證 - 檢查使用者是否有權限查看客戶
        $this->authorize('viewAny', Customer::class);

        // 2. 驗證請求參數
        $request->validate(['name' => 'required|string|max:255']);

        // 3. 檢查客戶名稱是否存在
        $exists = Customer::where('name', $request->input('name'))->exists();

        // 4. 返回結果
        return response()->json(['exists' => $exists]);
    }
}
