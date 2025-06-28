<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Data\PurchaseData;
use App\Services\PurchaseService;
use App\Data\PurchaseResponseData;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use App\Http\Resources\Api\PurchaseResource;

class PurchaseController extends Controller
{
    /**
     * Display a listing of the resource.
     * 
     * @return AnonymousResourceCollection
     */
    public function index(): AnonymousResourceCollection
    {
        try {
            $this->authorize('viewAny', Purchase::class);

            $purchases = QueryBuilder::for(Purchase::class)
                ->allowedFilters([
                    'order_number',
                    'status',
                    AllowedFilter::exact('store_id'),
                    AllowedFilter::scope('date_range', 'whereBetween'),
                ])
                ->allowedSorts(['order_number', 'purchased_at', 'total_amount', 'created_at'])
                ->defaultSort('-purchased_at')
                ->with(['store', 'items.productVariant.product'])
                ->withCount('items')
                ->withSum('items', 'quantity')
                ->paginate(request('per_page', 20));

            return PurchaseResource::collection($purchases);

        } catch (\Throwable $th) {
            Log::error('Purchase index error: ' . $th->getMessage(), [
                'trace' => $th->getTraceAsString()
            ]);

            return PurchaseResource::collection(collect([]));
        }
    }

    /**
     * Store a newly created resource in storage.
     * 
     * @param PurchaseData $purchaseData
     * @param PurchaseService $purchaseService
     * @return PurchaseResource
     */
    public function store(PurchaseData $purchaseData, PurchaseService $purchaseService): PurchaseResource
    {
        try {
            $this->authorize('create', Purchase::class);
            $purchase = $purchaseService->createPurchase($purchaseData);
            return new PurchaseResource($purchase->load(['store', 'items.productVariant.product']));

        } catch (\Throwable $th) {
            Log::error('Purchase store error: ' . $th->getMessage(), [
                'trace' => $th->getTraceAsString()
            ]);

            throw $th;
        }
    }

    /**
     * Display the specified resource.
     * 
     * @param string $id
     * @return PurchaseResource
     */
    public function show(string $id): PurchaseResource
    {
        try {
            $purchase = Purchase::with(['store', 'items.productVariant.product'])->findOrFail($id);
            $this->authorize('view', $purchase);
            return new PurchaseResource($purchase);

        } catch (\Throwable $th) {
            Log::error('Purchase show error: ' . $th->getMessage(), [
                'id' => $id,
                'trace' => $th->getTraceAsString()
            ]);

            throw $th;
        }
    }

    /**
     * Update the specified resource in storage.
     * 
     * @param PurchaseData $purchaseData
     * @param string $id
     * @param PurchaseService $purchaseService
     * @return PurchaseResource|JsonResponse
     */
    public function update(PurchaseData $purchaseData, string $id, PurchaseService $purchaseService): PurchaseResource|JsonResponse
    {
        try {
            $purchase = Purchase::findOrFail($id);
            $this->authorize('update', $purchase);

            if (!$purchase->canBeModified()) {
                return new JsonResponse(['message' => "進貨單狀態為 {$purchase->status_description}，無法修改"], 422);
            }

            $updatedPurchase = $purchaseService->updatePurchase($purchase, $purchaseData);
            return new PurchaseResource($updatedPurchase->load(['store', 'items.productVariant.product']));

        } catch (\Throwable $th) {
            Log::error('Purchase update error: ' . $th->getMessage(), [
                'id' => $id,
                'trace' => $th->getTraceAsString()
            ]);

            return new JsonResponse(['message' => '更新進貨單時發生錯誤'], 500);
        }
    }

    /**
     * Update the status of the specified purchase.
     * 
     * @param string $purchase
     * @param Request $request
     * @return PurchaseResource|JsonResponse
     */
    public function updateStatus(string $purchase, Request $request): PurchaseResource|JsonResponse
    {
        try {
            $purchase = Purchase::findOrFail($purchase);
            $this->authorize('update', $purchase);

            $request->validate([
                'status' => 'required|in:' . implode(',', array_keys(Purchase::getStatusOptions()))
            ]);

            $newStatus = $request->input('status');

            if (!$this->isValidStatusTransition($purchase->status, $newStatus)) {
                return new JsonResponse([
                    'message' => "無法從 {$purchase->status_description} 轉換到 " . Purchase::getStatusOptions()[$newStatus]
                ], 422);
            }

            $purchase->update(['status' => $newStatus]);
            return new PurchaseResource($purchase->fresh()->load('store', 'items.productVariant.product'));

        } catch (\Throwable $th) {
            Log::error('Purchase updateStatus error: ' . $th->getMessage(), [
                'purchase_id' => $purchase,
                'trace' => $th->getTraceAsString()
            ]);

            return new JsonResponse(['message' => '更新進貨單狀態時發生錯誤'], 500);
        }
    }

    /**
     * Cancel the specified purchase.
     * 
     * @param string $purchase
     * @return PurchaseResource|JsonResponse
     */
    public function cancel(string $purchase): PurchaseResource|JsonResponse
    {
        try {
            $purchase = Purchase::findOrFail($purchase);
            $this->authorize('update', $purchase);

            if (!$purchase->canBeCancelled()) {
                return new JsonResponse(['message' => "進貨單狀態為 {$purchase->status_description}，無法取消"], 422);
            }

            $purchase->update(['status' => Purchase::STATUS_CANCELLED]);
            return new PurchaseResource($purchase->fresh()->load('store', 'items.productVariant.product'));

        } catch (\Throwable $th) {
            Log::error('Purchase cancel error: ' . $th->getMessage(), [
                'purchase_id' => $purchase,
                'trace' => $th->getTraceAsString()
            ]);

            return new JsonResponse(['message' => '取消進貨單時發生錯誤'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $purchase = Purchase::findOrFail($id);
            
            $this->authorize('delete', $purchase);

            if ($purchase->status !== Purchase::STATUS_PENDING) {
                return new JsonResponse([
                    'message' => "只有待處理狀態的進貨單可以刪除"
                ], 422);
            }

            $purchase->delete();

            return new JsonResponse(['message' => '進貨單已刪除'], 200);

        } catch (\Throwable $th) {
            Log::error('Purchase destroy error: ' . $th->getMessage(), [
                'id' => $id,
                'trace' => $th->getTraceAsString()
            ]);

            return new JsonResponse(['message' => '刪除進貨單時發生錯誤'], 500);
        }
    }

    /**
     * 檢查狀態轉換是否合法
     * 
     * @param string $currentStatus
     * @param string $newStatus
     * @return bool
     */
    private function isValidStatusTransition(string $currentStatus, string $newStatus): bool
    {
        $validTransitions = [
            Purchase::STATUS_PENDING => [
                Purchase::STATUS_CONFIRMED,
                Purchase::STATUS_CANCELLED,
            ],
            Purchase::STATUS_CONFIRMED => [
                Purchase::STATUS_IN_TRANSIT,
                Purchase::STATUS_CANCELLED,
            ],
            Purchase::STATUS_IN_TRANSIT => [
                Purchase::STATUS_RECEIVED,
                Purchase::STATUS_PARTIALLY_RECEIVED,
            ],
            Purchase::STATUS_RECEIVED => [
                Purchase::STATUS_COMPLETED,
                Purchase::STATUS_PARTIALLY_RECEIVED,
            ],
            Purchase::STATUS_PARTIALLY_RECEIVED => [
                Purchase::STATUS_COMPLETED,
                Purchase::STATUS_RECEIVED,
            ],
        ];

        return in_array($newStatus, $validTransitions[$currentStatus] ?? []);
    }
}
