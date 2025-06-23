<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\InventoryTimeSeriesRequest;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group 報表與分析
 *
 * 報表與分析 API 端點，提供各種統計數據和分析報表
 */
class ReportController extends Controller
{
    protected InventoryService $inventoryService;

    /**
     * 建構函式
     * 
     * @param InventoryService $inventoryService
     */
    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * 獲取商品變體的庫存時序數據
     * 
     * 返回指定商品變體在特定日期範圍內的每日庫存水平數據，
     * 用於顯示庫存趨勢圖表。
     * 
     * @group 報表與分析
     * @authenticated
     * 
     * @queryParam product_variant_id integer required 商品變體ID. Example: 1
     * @queryParam start_date date required 開始日期 (YYYY-MM-DD). Example: 2025-01-01
     * @queryParam end_date date required 結束日期 (YYYY-MM-DD). Example: 2025-01-31
     * 
     * @response 200 scenario="成功獲取庫存趨勢數據" {
     *   "data": [
     *     {"date": "2025-01-01", "quantity": 100},
     *     {"date": "2025-01-02", "quantity": 105}
     *   ]
     * }
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function inventoryTimeSeries(Request $request): JsonResponse
    {
        // 手動驗證查詢參數
        $request->validate([
            'product_variant_id' => 'required|integer|exists:product_variants,id',
            'start_date' => 'required|date|date_format:Y-m-d',
            'end_date' => 'required|date|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $productVariantId = $request->query('product_variant_id');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        
        $timeSeries = $this->inventoryService->getInventoryTimeSeries(
            $productVariantId,
            $startDate,
            $endDate
        );
        
        return response()->json([
            'data' => $timeSeries
        ]);
    }
} 