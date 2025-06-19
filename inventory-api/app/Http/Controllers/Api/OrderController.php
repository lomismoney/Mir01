<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use App\Http\Requests\Api\StoreOrderRequest;
use App\Http\Requests\Api\UpdateOrderRequest;
use App\Services\OrderService;

class OrderController extends Controller
{
    public function __construct(protected OrderService $orderService)
    {
    }
    /**
     * @group 訂單管理
     * @authenticated
     * @queryParam search string 關鍵字搜尋，將匹配訂單號、客戶名稱。Example: PO-20250619-001
     * @queryParam shipping_status string 按貨物進度篩選。Example: 待出貨
     * @queryParam payment_status string 按付款進度篩選。Example: 待付款
     * @queryParam start_date date 按創建日期篩選的開始日期 (格式: Y-m-d)。Example: 2025-01-01
     * @queryParam end_date date 按創建日期篩選的結束日期 (格式: Y-m-d)。Example: 2025-06-19
     */
    public function index(Request $request)
    {
        // 1. 權限驗證 (暫時關閉以進行測試)
        // $this->authorize('viewAny', Order::class);

        // 2. 驗證請求參數
        $request->validate([
            'search'          => 'nullable|string',
            'shipping_status' => 'nullable|string',
            'payment_status'  => 'nullable|string',
            'start_date'      => 'nullable|date_format:Y-m-d',
            'end_date'        => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        // 3. 構建查詢
        $orders = Order::query()
            // 預加載客戶和創建者信息，防止 N+1 問題
            ->with(['customer', 'creator'])
            // 條件化查詢
            ->when($request->filled('search'), function ($query) use ($request) {
                $searchTerm = '%' . $request->input('search') . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('order_number', 'like', $searchTerm)
                      ->orWhereHas('customer', function ($customerQuery) use ($searchTerm) {
                          $customerQuery->where('name', 'like', $searchTerm);
                      });
                });
            })
            ->when($request->filled('shipping_status'), function ($query) use ($request) {
                $query->where('shipping_status', $request->input('shipping_status'));
            })
            ->when($request->filled('payment_status'), function ($query) use ($request) {
                $query->where('payment_status', $request->input('payment_status'));
            })
            ->when($request->filled('start_date'), function ($query) use ($request) {
                $query->whereDate('created_at', '>=', $request->input('start_date'));
            })
            ->when($request->filled('end_date'), function ($query) use ($request) {
                $query->whereDate('created_at', '<=', $request->input('end_date'));
            })
            // 4. 排序與分頁
            ->latest() // 默認按創建時間倒序
            ->paginate(15);

        // 5. 返回標準化的 API 資源集合
        return OrderResource::collection($orders);
    }

    /**
     * @group 訂單管理
     * @authenticated
     * 創建新訂單
     * 
     * 此端點用於創建新的訂單，包含訂單頭資訊和訂單項目明細。
     * 系統會自動生成訂單號、計算總金額，並記錄初始狀態歷史。
     * 
     * @bodyParam customer_id integer required 客戶ID。Example: 1
     * @bodyParam shipping_status string required 貨物狀態。Example: 待出貨
     * @bodyParam payment_status string required 付款狀態。Example: 待付款
     * @bodyParam shipping_fee numeric 運費。Example: 100
     * @bodyParam tax numeric 稅金。Example: 50
     * @bodyParam discount_amount numeric 折扣金額。Example: 0
     * @bodyParam payment_method string required 付款方式。Example: 轉帳
     * @bodyParam order_source string required 訂單來源。Example: 現場客戶
     * @bodyParam shipping_address string required 運送地址。Example: 台北市信義區信義路五段7號
     * @bodyParam notes string 備註。Example: 請小心輕放
     * @bodyParam items array required 訂單項目清單。
     * @bodyParam items.*.product_variant_id integer 商品變體ID（訂製商品可為空）。Example: 1
     * @bodyParam items.*.is_stocked_sale boolean required 是否為庫存銷售。Example: true
     * @bodyParam items.*.status string required 項目狀態。Example: 待處理
     * @bodyParam items.*.custom_specifications json 訂製規格（僅訂製商品需要）。Example: {"寬度": "150cm"}
     * @bodyParam items.*.product_name string required 商品名稱。Example: 標準辦公桌
     * @bodyParam items.*.sku string required SKU。Example: DESK-001
     * @bodyParam items.*.price numeric required 單價。Example: 5000
     * @bodyParam items.*.quantity integer required 數量。Example: 2
     * 
     * @response 201
     */
    public function store(StoreOrderRequest $request)
    {
        // 1. 權限驗證 (可選)
        // $this->authorize('create', Order::class);

        // 2. 將所有業務邏輯委派給 Service 層
        $order = $this->orderService->createOrder($request->validated());

        // 3. 返回標準化的 API 資源，並附帶 201 Created 狀態碼
        return (new OrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * @group 訂單管理
     * @authenticated
     * @urlParam order integer required 訂單的 ID。 Example: 1
     * @responseFile storage/responses/order.show.json
     */
    public function show(Order $order)
    {
        // 1. 權限驗證
        // $this->authorize('view', $order);

        // 2. 預加載所有需要的關聯數據，包括嵌套關聯，以優化性能
        $order->load([
            'items.productVariant', // 訂單項目及其關聯的商品變體
            'customer.defaultAddress', // 客戶及其預設地址
            'creator',              // 創建者
            'statusHistories.user'  // 狀態歷史及其操作者
        ]);

        // 3. 返回標準化的單一資源
        return new OrderResource($order);
    }

    /**
     * @group 訂單管理
     * @authenticated
     * 更新訂單
     * 
     * 此端點用於更新現有訂單的資訊。支援部分更新（PATCH），
     * 只需提供要更新的欄位即可。當更新訂單項目時，
     * 系統會自動處理項目的新增、更新和刪除，並重新計算訂單總額。
     * 
     * @urlParam order integer required 訂單的 ID。Example: 1
     * 
     * @bodyParam customer_id integer 客戶ID。Example: 2
     * @bodyParam shipping_status string 貨物狀態（pending, processing, shipped, delivered）。Example: processing
     * @bodyParam payment_status string 付款狀態（pending, paid, failed, refunded）。Example: paid
     * @bodyParam shipping_fee numeric 運費。Example: 150
     * @bodyParam tax numeric 稅金。Example: 75
     * @bodyParam discount_amount numeric 折扣金額。Example: 50
     * @bodyParam payment_method string 付款方式。Example: 信用卡
     * @bodyParam shipping_address string 運送地址。Example: 台北市大安區羅斯福路四段1號
     * @bodyParam billing_address string 帳單地址。Example: 台北市大安區羅斯福路四段1號
     * @bodyParam notes string 備註。Example: 請在下午配送
     * 
     * @bodyParam items array 訂單項目清單（提供此參數時會同步所有項目）。
     * @bodyParam items.*.id integer 項目ID（用於更新現有項目，新項目不需提供）。Example: 1
     * @bodyParam items.*.product_variant_id integer 商品變體ID。Example: 2
     * @bodyParam items.*.is_stocked_sale boolean required 是否為庫存銷售。Example: true
     * @bodyParam items.*.status string required 項目狀態。Example: confirmed
     * @bodyParam items.*.quantity integer required 數量。Example: 3
     * @bodyParam items.*.price numeric required 單價。Example: 5500
     * @bodyParam items.*.cost numeric required 成本。Example: 3500
     * @bodyParam items.*.tax_rate numeric required 稅率。Example: 5
     * @bodyParam items.*.discount_amount numeric required 折扣金額。Example: 0
     * @bodyParam items.*.custom_product_name string 訂製商品名稱。Example: 客製化辦公椅
     * @bodyParam items.*.custom_product_specs string 訂製商品規格。Example: 高度可調，藍色布料
     * 
     * @response 200
     */
    public function update(UpdateOrderRequest $request, Order $order)
    {
        // 1. 權限驗證
        // $this->authorize('update', $order);

        // 2. 將所有業務邏輯委派給 Service 層
        $updatedOrder = $this->orderService->updateOrder($order, $request->validated());

        // 3. 返回標準化的單一資源
        return new OrderResource($updatedOrder);
    }

    /**
     * @group 訂單管理
     * @authenticated
     * @urlParam order integer required 要刪除的訂單的 ID。 Example: 1
     * @response 204 scenario="刪除成功"
     */
    public function destroy(Order $order)
    {
        // 1. 權限驗證
        // $this->authorize('delete', $order);

        // 2. 執行刪除操作
        // 注意：此操作會觸發我們在遷移中設定的所有級聯刪除
        $order->delete();

        // 3. 返回 204 No Content 響應，這是 RESTful API 中成功刪除操作的標準實踐
        return response()->noContent();
    }

    /**
     * @group 訂單管理
     * @authenticated
     * 確認訂單付款
     * 
     * 此端點用於確認訂單的付款狀態，將付款狀態從「待付款」更新為「已付款」。
     * 系統會自動記錄狀態變更歷史，並更新相關時間戳。
     * 
     * @urlParam order integer required 要確認付款的訂單 ID。Example: 1
     * 
     * @response 200 {
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250619-001",
     *     "payment_status": "paid",
     *     "updated_at": "2025-06-19T10:30:00.000000Z"
     *   }
     * }
     * @response 422 scenario="訂單狀態不允許此操作" {
     *   "message": "此訂單的付款狀態不允許確認付款操作",
     *   "errors": {
     *     "payment_status": ["訂單已付款，無法重複確認"]
     *   }
     * }
     */
    public function confirmPayment(Order $order)
    {
        // 1. 權限驗證
        // $this->authorize('update', $order);

        // 2. 業務邏輯驗證
        if ($order->payment_status === 'paid') {
            return response()->json([
                'message' => '此訂單的付款狀態不允許確認付款操作',
                'errors' => [
                    'payment_status' => ['訂單已付款，無法重複確認']
                ]
            ], 422);
        }

        // 3. 委派給 Service 層處理業務邏輯
        $updatedOrder = $this->orderService->confirmPayment($order);

        // 4. 返回更新後的訂單資源
        return new OrderResource($updatedOrder);
    }

    /**
     * @group 訂單管理
     * @authenticated
     * 創建訂單出貨記錄
     * 
     * 此端點用於為訂單創建出貨記錄，將貨物狀態更新為「已出貨」。
     * 可以提供物流追蹤號碼等出貨相關資訊。
     * 
     * @urlParam order integer required 要創建出貨記錄的訂單 ID。Example: 1
     * 
     * @bodyParam tracking_number string required 物流追蹤號碼。Example: SF1234567890
     * @bodyParam carrier string 承運商名稱。Example: 順豐速運
     * @bodyParam shipped_at datetime 實際出貨時間（格式: Y-m-d H:i:s）。Example: 2025-06-19 14:30:00
     * @bodyParam estimated_delivery_date date 預計送達日期（格式: Y-m-d）。Example: 2025-06-21
     * @bodyParam notes string 出貨備註。Example: 易碎物品，請小心處理
     * 
     * @response 200 {
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250619-001",
     *     "shipping_status": "shipped",
     *     "tracking_number": "SF1234567890",
     *     "shipped_at": "2025-06-19T14:30:00.000000Z",
     *     "updated_at": "2025-06-19T14:30:00.000000Z"
     *   }
     * }
     * @response 422 scenario="訂單狀態不允許此操作" {
     *   "message": "此訂單的貨物狀態不允許出貨操作",
     *   "errors": {
     *     "shipping_status": ["訂單已出貨，無法重複操作"]
     *   }
     * }
     */
    public function createShipment(Request $request, Order $order)
    {
        // 1. 權限驗證
        // $this->authorize('update', $order);

        // 2. 驗證請求參數
        $validated = $request->validate([
            'tracking_number' => 'required|string|max:100',
            'carrier' => 'nullable|string|max:100',
            'shipped_at' => 'nullable|date_format:Y-m-d H:i:s',
            'estimated_delivery_date' => 'nullable|date_format:Y-m-d|after_or_equal:today',
            'notes' => 'nullable|string|max:500',
        ]);

        // 3. 業務邏輯驗證
        if (in_array($order->shipping_status, ['shipped', 'delivered'])) {
            return response()->json([
                'message' => '此訂單的貨物狀態不允許出貨操作',
                'errors' => [
                    'shipping_status' => ['訂單已出貨，無法重複操作']
                ]
            ], 422);
        }

        // 4. 委派給 Service 層處理業務邏輯
        $updatedOrder = $this->orderService->createShipment($order, $validated);

        // 5. 返回更新後的訂單資源
        return new OrderResource($updatedOrder);
    }
}
