<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\InventoryTimeSeriesRequest;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**

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
     *   "data": [
     *     {"date": "2025-01-01", "quantity": 100},
     *     {"date": "2025-01-02", "quantity": 105}
     *   ]
     * }
     * 

     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "product_variant_id": ["商品變體ID為必填欄位"]
     *   }
     * }
     * 

     *   "message": "庫存數據獲取失敗",
     *   "error": "服務暫時不可用，請稍後再試"
     * }
     * 
     * @param InventoryTimeSeriesRequest $request
     * @return JsonResponse
     */
    public function inventoryTimeSeries(InventoryTimeSeriesRequest $request): JsonResponse
    {
        try {
            // 從驗證過的查詢參數中獲取數據
            $validated = $request->validated();
            
            // 調用服務層獲取庫存時序數據，添加具體的錯誤處理
            try {
                $timeSeries = $this->inventoryService->getInventoryTimeSeries(
                    $validated['product_variant_id'],
                    $validated['start_date'],
                    $validated['end_date']
                );
            } catch (\InvalidArgumentException $e) {
                // 處理服務層參數錯誤
                return response()->json([
                    'message' => '參數錯誤',
                    'error' => $e->getMessage()
                ], 400);
            } catch (\Exception $e) {
                // 處理服務層其他錯誤（數據庫錯誤、計算錯誤等）
                \Log::error('庫存時序數據服務層錯誤', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'product_variant_id' => $validated['product_variant_id'],
                    'start_date' => $validated['start_date'],
                    'end_date' => $validated['end_date'],
                ]);
                
                return response()->json([
                    'message' => '庫存數據處理失敗',
                    'error' => '數據處理過程中發生錯誤，請稍後再試'
                ], 500);
            }
            
            return response()->json([
                'data' => $timeSeries
            ]);
            
        } catch (\Exception $e) {
            // 處理其他未預期的錯誤
            \Log::error('庫存時序數據獲取未預期錯誤', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            
            return response()->json([
                'message' => '系統錯誤',
                'error' => '服務暫時不可用，請稍後再試'
            ], 500);
        }
    }
} 