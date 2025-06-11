<?php

namespace App\Http\Controllers\Api\V1;

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
     * @response 201 {
     *  "id": 1,
     *  "order_number": "PO-20240101-001",
     *  "total_amount": 150.00,
     *  "status": "pending",
     *  "purchased_at": "2024-01-01T00:00:00+08:00",
     *  "items": []
     * }
     */
    public function store(PurchaseData $purchaseData, PurchaseService $purchaseService)
    {
        // 呼叫服務層來處理複雜的業務邏輯
        $purchase = $purchaseService->createPurchase($purchaseData);

        // 為了更清晰的回應，我們載入關聯的 items 和 product
        $purchase->load('items.product');

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
