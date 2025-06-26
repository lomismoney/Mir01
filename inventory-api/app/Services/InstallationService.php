<?php

namespace App\Services;

use App\Models\Installation;
use App\Models\InstallationItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

/**
 * 安裝管理服務
 * 
 * 負責處理安裝單的創建、更新、狀態管理等業務邏輯
 */
class InstallationService
{
    /**
     * @var InstallationNumberGenerator
     */
    private InstallationNumberGenerator $numberGenerator;

    /**
     * 建構子
     */
    public function __construct(InstallationNumberGenerator $numberGenerator)
    {
        $this->numberGenerator = $numberGenerator;
    }

    /**
     * 建立新的安裝單
     * 
     * @param array $data 安裝單資料
     * @param int $creatorId 建立者ID
     * @return Installation
     * @throws \Exception
     */
    public function createInstallation(array $data, int $creatorId): Installation
    {
        return DB::transaction(function () use ($data, $creatorId) {
            // 生成安裝單號
            $installationNumber = $this->numberGenerator->generateNextNumber();

            // 建立安裝單主檔
            $installation = Installation::create([
                'installation_number' => $installationNumber,
                'order_id' => $data['order_id'] ?? null,
                'installer_user_id' => $data['installer_user_id'] ?? null,
                'created_by' => $creatorId,
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'installation_address' => $data['installation_address'],
                'status' => 'pending',
                'scheduled_date' => $data['scheduled_date'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            // 建立安裝項目
            foreach ($data['items'] as $item) {
                InstallationItem::create([
                    'installation_id' => $installation->id,
                    'order_item_id' => $item['order_item_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'sku' => $item['sku'],
                    'quantity' => $item['quantity'],
                    'specifications' => $item['specifications'] ?? null,
                    'status' => 'pending',
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return $installation->fresh(['items']);
        });
    }

    /**
     * 從訂單建立安裝單
     * 
     * @param int $orderId 訂單ID
     * @param array $itemIds 要安裝的訂單項目ID
     * @param array $additionalData 額外資料
     * @param int $creatorId 建立者ID
     * @return Installation
     * @throws \Exception
     */
    public function createFromOrder(int $orderId, array $itemIds, array $additionalData, int $creatorId): Installation
    {
        return DB::transaction(function () use ($orderId, $itemIds, $additionalData, $creatorId) {
            // 取得訂單資料
            $order = Order::with(['customer', 'items' => function ($query) use ($itemIds) {
                $query->whereIn('id', $itemIds);
            }])->findOrFail($orderId);

            // 準備安裝單資料
            $installationData = [
                'order_id' => $orderId,
                'installer_user_id' => $additionalData['installer_user_id'] ?? null,
                'customer_name' => $order->customer->name,
                'customer_phone' => $order->customer->phone,
                'installation_address' => $additionalData['installation_address'] ?? $order->shipping_address,
                'scheduled_date' => $additionalData['scheduled_date'] ?? null,
                'notes' => $additionalData['notes'] ?? null,
                'items' => []
            ];

            // 轉換訂單項目為安裝項目
            foreach ($order->items as $orderItem) {
                $installationData['items'][] = [
                    'order_item_id' => $orderItem->id,
                    'product_name' => $orderItem->product_name,
                    'sku' => $orderItem->sku,
                    'quantity' => $orderItem->quantity,
                    'specifications' => $additionalData['specifications'][$orderItem->id] ?? null,
                ];
            }

            return $this->createInstallation($installationData, $creatorId);
        });
    }

    /**
     * 更新安裝單
     * 
     * @param Installation $installation
     * @param array $data
     * @return Installation
     * @throws \Exception
     */
    public function updateInstallation(Installation $installation, array $data): Installation
    {
        return DB::transaction(function () use ($installation, $data) {
            // 準備更新資料 - 只包含明確提供的欄位
            $updateData = [];
            
            // 檢查每個欄位是否在 $data 中明確提供
            if (array_key_exists('installer_user_id', $data)) {
                $updateData['installer_user_id'] = $data['installer_user_id'];
            }
            if (array_key_exists('customer_name', $data)) {
                $updateData['customer_name'] = $data['customer_name'];
            }
            if (array_key_exists('customer_phone', $data)) {
                $updateData['customer_phone'] = $data['customer_phone'];
            }
            if (array_key_exists('installation_address', $data)) {
                $updateData['installation_address'] = $data['installation_address'];
            }
            if (array_key_exists('status', $data)) {
                $updateData['status'] = $data['status'];
            }
            if (array_key_exists('scheduled_date', $data)) {
                $updateData['scheduled_date'] = $data['scheduled_date'];
            }
            if (array_key_exists('actual_start_time', $data)) {
                $updateData['actual_start_time'] = $data['actual_start_time'];
            }
            if (array_key_exists('actual_end_time', $data)) {
                $updateData['actual_end_time'] = $data['actual_end_time'];
            }
            if (array_key_exists('notes', $data)) {
                $updateData['notes'] = $data['notes'];
            }
            
            // 更新安裝單主檔
            if (!empty($updateData)) {
                $installation->update($updateData);
            }

            // 更新安裝項目（如果有提供）
            if (isset($data['items'])) {
                $existingItemIds = [];
                
                // 注意：如果 $data['items'] 為空陣列，將會刪除所有現有項目
                // 這是預期行為 - 明確提供空陣列表示要清空所有項目
                foreach ($data['items'] as $itemData) {
                    if (isset($itemData['id'])) {
                        // 更新現有項目
                        $item = InstallationItem::findOrFail($itemData['id']);
                        
                        // 準備項目更新資料 - 只包含明確提供的欄位
                        $itemUpdateData = [];
                        
                        if (array_key_exists('product_name', $itemData)) {
                            $itemUpdateData['product_name'] = $itemData['product_name'];
                        }
                        if (array_key_exists('sku', $itemData)) {
                            $itemUpdateData['sku'] = $itemData['sku'];
                        }
                        if (array_key_exists('quantity', $itemData)) {
                            $itemUpdateData['quantity'] = $itemData['quantity'];
                        }
                        if (array_key_exists('specifications', $itemData)) {
                            $itemUpdateData['specifications'] = $itemData['specifications'];
                        }
                        if (array_key_exists('status', $itemData)) {
                            $itemUpdateData['status'] = $itemData['status'];
                        }
                        if (array_key_exists('notes', $itemData)) {
                            $itemUpdateData['notes'] = $itemData['notes'];
                        }
                        
                        if (!empty($itemUpdateData)) {
                            $item->update($itemUpdateData);
                        }
                        
                        $existingItemIds[] = $item->id;
                    } else {
                        // 新增項目
                        $newItem = InstallationItem::create([
                            'installation_id' => $installation->id,
                            'order_item_id' => $itemData['order_item_id'] ?? null,
                            'product_name' => $itemData['product_name'],
                            'sku' => $itemData['sku'],
                            'quantity' => $itemData['quantity'],
                            'specifications' => $itemData['specifications'] ?? null,
                            'status' => $itemData['status'] ?? 'pending',
                            'notes' => $itemData['notes'] ?? null,
                        ]);
                        
                        $existingItemIds[] = $newItem->id;
                    }
                }
                
                // 刪除未包含在更新中的項目
                // 注意：如果 $existingItemIds 為空（即 $data['items'] 為空陣列），將刪除所有項目
                $installation->items()->whereNotIn('id', $existingItemIds)->delete();
            }

            return $installation->fresh(['items']);
        });
    }

    /**
     * 更新安裝單狀態
     * 
     * @param Installation $installation
     * @param string $newStatus
     * @param array $additionalData
     * @return Installation
     */
    public function updateStatus(Installation $installation, string $newStatus, array $additionalData = []): Installation
    {
        $updateData = ['status' => $newStatus];

        // 根據狀態自動設定時間
        if ($newStatus === 'in_progress' && !$installation->actual_start_time) {
            $updateData['actual_start_time'] = now();
        }

        if ($newStatus === 'completed' && !$installation->actual_end_time) {
            $updateData['actual_end_time'] = now();
        }

        // 合併額外資料
        $updateData = array_merge($updateData, $additionalData);

        return $this->updateInstallation($installation, $updateData);
    }

    /**
     * 取消安裝單
     * 
     * @param Installation $installation
     * @param string|null $reason
     * @return Installation
     * @throws \Exception
     */
    public function cancelInstallation(Installation $installation, ?string $reason = null): Installation
    {
        if (!$installation->canBeCancelled()) {
            throw new \Exception("無法取消狀態為 {$installation->status} 的安裝單");
        }

        $updateData = ['status' => 'cancelled'];
        
        if ($reason) {
            $currentNotes = $installation->notes ?? '';
            $updateData['notes'] = $currentNotes . "\n取消原因：" . $reason;
        }

        return $this->updateInstallation($installation, $updateData);
    }

    /**
     * 分配安裝師傅
     * 
     * @param Installation $installation
     * @param int $installerUserId
     * @return Installation
     */
    public function assignInstaller(Installation $installation, int $installerUserId): Installation
    {
        return $this->updateInstallation($installation, [
            'installer_user_id' => $installerUserId,
            'status' => $installation->status === 'pending' ? 'scheduled' : $installation->status,
        ]);
    }

    /**
     * 更新安裝項目狀態
     * 
     * @param InstallationItem $item
     * @param string $status
     * @return InstallationItem
     */
    public function updateItemStatus(InstallationItem $item, string $status): InstallationItem
    {
        $item->update(['status' => $status]);

        // 檢查是否所有項目都已完成
        $installation = $item->installation;
        if ($status === 'completed' && $installation->areAllItemsCompleted()) {
            // 自動更新安裝單狀態為已完成
            $this->updateStatus($installation, 'completed');
        }

        return $item;
    }

    /**
     * 取得安裝師傅的行程
     * 
     * @param int $installerUserId
     * @param \DateTime $startDate
     * @param \DateTime $endDate
     * @return Collection
     */
    public function getInstallerSchedule(int $installerUserId, \DateTime $startDate, \DateTime $endDate): Collection
    {
        return Installation::where('installer_user_id', $installerUserId)
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->whereNotIn('status', ['cancelled'])
            ->with(['items', 'order.customer'])
            ->orderBy('scheduled_date')
            ->get();
    }
} 