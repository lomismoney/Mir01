<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Data\PurchaseData;
use App\Services\PurchaseService;
use App\Data\PurchaseResponseData;
use App\Models\Purchase;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     * 
     * @group 進貨管理
     * @authenticated
     * @bodyParam store_id integer required 門市ID Example: 1
     * @bodyParam order_number string required 進貨單號 Example: PO-20240101-001
     * @bodyParam purchased_at string 進貨日期 Example: 2024-01-01T10:00:00+08:00
     * @bodyParam shipping_cost number required 總運費成本 Example: 150.00
     * @bodyParam items object[] required 進貨項目列表 
     * @bodyParam items[].product_variant_id integer required 商品變體ID Example: 1
     * @bodyParam items[].quantity integer required 數量 Example: 10
     * @bodyParam items[].unit_price number required 單價 Example: 299.00
     * @bodyParam items[].cost_price number required 成本價格 Example: 150.00
     * 
     * @responseFile 201 storage/responses/purchase-store-response.json
     */
    public function store(PurchaseData $purchaseData, PurchaseService $purchaseService)
    {
        // 呼叫服務層來處理複雜的業務邏輯
        $purchase = $purchaseService->createPurchase($purchaseData);

        // 為了更清晰的回應，我們載入關聯的 items 和相關資料
        $purchase->load('items.productVariant.product');

        // 使用一個專門的回應 DTO 來格式化輸出
        return PurchaseResponseData::from($purchase);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
