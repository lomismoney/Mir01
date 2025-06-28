<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCustomerRequest;
use App\Http\Requests\Api\UpdateCustomerRequest;
use App\Http\Resources\Api\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CustomerController extends Controller
{
    /**
     * 客戶服務實例
     *
     * @var CustomerService
     */
    protected $customerService;

    /**
     * 建構函數 - 注入 CustomerService
     *
     * @param CustomerService $customerService
     */
    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }
    /**



     * 

     *   "data": [
     *     {
     *       "id": 1,
     *       "name": "客戶名稱",
     *       "phone": "0912345678",
     *       "email": "customer@example.com",
     *       "is_company": false,
     *       "tax_id": null,
     *       "industry_type": "設計師",
     *       "payment_type": "現金付款",
     *       "contact_address": "台北市信義區",
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
    public function index(Request $request)
    {
        // 1. 權限驗證
        $this->authorize('viewAny', Customer::class);

        // 2. 驗證請求參數
        $request->validate([
            'search'     => 'nullable|string',
            'start_date' => 'nullable|date_format:Y-m-d',
            'end_date'   => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        // 3. 構建查詢
        $customers = Customer::query()
            // 預加載預設地址，防止 N+1 問題
            ->with('defaultAddress')
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
     * 創建新客戶
     *











     * 

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
            // 1. 權限驗證 - 檢查使用者是否有權限創建客戶
            $this->authorize('create', Customer::class);

            // 2. 將驗證過的數據傳遞給 Service 層處理
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
     * 顯示指定的客戶詳細資訊
     *

     * 

     *   "data": {
     *     "id": 1,
     *     "name": "客戶名稱",
     *     "phone": "0912345678",
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
    public function show(Customer $customer)
    {
        // 1. 權限驗證
        $this->authorize('view', $customer);

        // 2. 預加載所有需要的關聯數據，以優化性能
        $customer->load(['addresses', 'defaultAddress']);

        // 3. 返回標準化的單一資源
        return new CustomerResource($customer);
    }

    /**
     * 更新指定的客戶資訊
     *













     * 

     *   "data": {
     *     "id": 1,
     *     "name": "測試客戶（已更新）",
     *     "phone": "0987654321",
     *     "email": "customer@example.com",
     *     "is_company": false,
     *     "tax_id": null,
     *     "industry_type": "設計師",
     *     "payment_type": "現金付款",
     *     "contact_address": "台北市信義區",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T12:00:00.000000Z"
     *   }
     * }
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        try {
            // 1. 權限驗證 - 檢查使用者是否有權限更新此客戶
            $this->authorize('update', $customer);

            // 2. 將驗證過的數據傳遞給 Service 層處理
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
     * 刪除指定的客戶
     *


     */
    public function destroy(Customer $customer)
    {
        // 1. 權限驗證
        $this->authorize('delete', $customer);

        // 2. 執行刪除操作
        $customer->delete();

        // 3. 返回 204 No Content 響應，這是 RESTful API 中成功刪除操作的標準實踐
        return response()->noContent();
    }

    /**
     * 檢查客戶名稱是否存在
     *



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
