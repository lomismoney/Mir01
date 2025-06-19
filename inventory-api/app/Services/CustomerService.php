<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

/**
 * 客戶管理業務服務層
 * 
 * 負責處理客戶相關的複雜業務邏輯，包括：
 * - 客戶創建和地址管理
 * - 預設地址邏輯處理
 * - 數據一致性保證
 */
class CustomerService
{
    /**
     * 創建新客戶及其地址資訊
     *
     * @param array $validatedData 已驗證的客戶數據
     * @return Customer 創建完成的客戶實例（包含關聯地址）
     * @throws \Exception 當創建過程中出現錯誤時拋出異常
     */
    public function createCustomer(array $validatedData): Customer
    {
        return DB::transaction(function () use ($validatedData) {
            Log::info('開始創建客戶', ['data' => $validatedData]);

            // 1. 創建客戶主體記錄
            $customer = Customer::create([
                'name' => $validatedData['name'],
                'phone' => $validatedData['phone'] ?? null,
                'is_company' => $validatedData['is_company'],
                'tax_id' => $validatedData['tax_id'] ?? null,
                'industry_type' => $validatedData['industry_type'],
                'payment_type' => $validatedData['payment_type'],
                'contact_address' => $validatedData['contact_address'] ?? null,
                // 初始化金額欄位為 0
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
            ]);

            Log::info('客戶主體創建成功', ['customer_id' => $customer->id]);

            // 2. 處理地址資訊（如果有提供）
            if (!empty($validatedData['addresses'])) {
                $this->createCustomerAddresses($customer, $validatedData['addresses']);
            }

            // 3. 確保預設地址邏輯正確
            $this->ensureSingleDefaultAddress($customer);

            // 4. 記錄成功日誌
            Log::info('客戶創建完成', [
                'customer_id' => $customer->id,
                'name' => $customer->name,
                'addresses_count' => $customer->addresses()->count()
            ]);

            // 5. 返回包含所有關聯數據的客戶實例
            return $customer->load(['addresses', 'defaultAddress']);
        });
    }

    /**
     * 為客戶批量創建地址
     *
     * @param Customer $customer 客戶實例
     * @param array $addressesData 地址數據陣列
     * @return void
     */
    protected function createCustomerAddresses(Customer $customer, array $addressesData): void
    {
        foreach ($addressesData as $addressData) {
            CustomerAddress::create([
                'customer_id' => $customer->id,
                'address' => $addressData['address'],
                'is_default' => $addressData['is_default'],
            ]);
        }

        Log::info('客戶地址創建完成', [
            'customer_id' => $customer->id,
            'addresses_count' => count($addressesData)
        ]);
    }

    /**
     * 確保客戶有且只有一個預設地址
     *
     * 業務規則：
     * 1. 如果沒有預設地址，將第一個地址設為預設
     * 2. 如果有多個預設地址，保留最新的一個
     * 3. 記錄所有操作以便追蹤
     *
     * @param Customer $customer 客戶實例
     * @return void
     */
    protected function ensureSingleDefaultAddress(Customer $customer): void
    {
        $addresses = $customer->addresses()->get();
        
        if ($addresses->isEmpty()) {
            // 沒有地址，無需處理
            return;
        }

        $defaultAddresses = $addresses->where('is_default', true);

        if ($defaultAddresses->count() === 0) {
            // 沒有預設地址，將第一個設為預設
            $firstAddress = $addresses->first();
            $firstAddress->update(['is_default' => true]);
            
            Log::info('設定第一個地址為預設地址', [
                'customer_id' => $customer->id,
                'address_id' => $firstAddress->id
            ]);
        } elseif ($defaultAddresses->count() > 1) {
            // 有多個預設地址，保留最新的一個
            $latestDefault = $defaultAddresses->sortByDesc('id')->first();
            
            // 將其他預設地址取消預設
            $customer->addresses()
                ->where('is_default', true)
                ->where('id', '!=', $latestDefault->id)
                ->update(['is_default' => false]);
            
            Log::info('修正多個預設地址問題', [
                'customer_id' => $customer->id,
                'kept_default_id' => $latestDefault->id,
                'removed_defaults_count' => $defaultAddresses->count() - 1
            ]);
        }
    }

    /**
     * 更新現有客戶及其地址資訊
     *
     * @param Customer $customer 要更新的客戶實例
     * @param array $validatedData 已驗證的更新數據
     * @return Customer 更新完成的客戶實例（包含關聯地址）
     * @throws \Exception 當更新過程中出現錯誤時拋出異常
     */
    public function updateCustomer(Customer $customer, array $validatedData): Customer
    {
        return DB::transaction(function () use ($customer, $validatedData) {
            Log::info('開始更新客戶', [
                'customer_id' => $customer->id,
                'data' => $validatedData
            ]);

            // 1. 更新客戶主體資訊（排除地址陣列）
            $customer->update(Arr::except($validatedData, ['addresses']));

            Log::info('客戶主體更新成功', ['customer_id' => $customer->id]);

            // 2. 同步地址資訊（如果有提供）
            if (isset($validatedData['addresses'])) {
                $this->syncAddresses($customer, $validatedData['addresses']);
            }

            // 3. 確保預設地址邏輯正確
            $this->ensureSingleDefaultAddress($customer);

            // 4. 記錄成功日誌
            Log::info('客戶更新完成', [
                'customer_id' => $customer->id,
                'name' => $customer->name,
                'addresses_count' => $customer->addresses()->count()
            ]);

            // 5. 返回包含所有關聯數據的客戶實例
            return $customer->load(['addresses', 'defaultAddress']);
        });
    }

    /**
     * 同步客戶地址資訊
     * 
     * 此方法實現智慧地址同步：
     * - 刪除不再存在的地址
     * - 更新現有地址
     * - 創建新地址
     *
     * @param Customer $customer 客戶實例
     * @param array $addressesData 新的地址資料陣列
     * @return void
     */
    protected function syncAddresses(Customer $customer, array $addressesData): void
    {
        // 獲取現有地址 ID 列表
        $existingAddressIds = $customer->addresses()->pluck('id')->all();
        
        // 獲取前端傳入的地址 ID 列表（排除新增地址）
        $incomingAddressIds = Arr::pluck(
            Arr::where($addressesData, fn($addr) => isset($addr['id'])), 
            'id'
        );

        // 計算需要刪除的地址 ID（存在於資料庫但不在前端傳入的資料中）
        $idsToDelete = array_diff($existingAddressIds, $incomingAddressIds);
        
        if (!empty($idsToDelete)) {
            $deletedCount = $customer->addresses()->whereIn('id', $idsToDelete)->delete();
            
            Log::info('刪除不再需要的地址', [
                'customer_id' => $customer->id,
                'deleted_ids' => $idsToDelete,
                'deleted_count' => $deletedCount
            ]);
        }

        // 更新或創建地址
        foreach ($addressesData as $addressData) {
            $addressId = $addressData['id'] ?? null;
            
            if ($addressId) {
                // 更新現有地址
                $address = $customer->addresses()->updateOrCreate(
                    ['id' => $addressId],
                    Arr::except($addressData, ['id'])
                );
                
                Log::info('更新現有地址', [
                    'customer_id' => $customer->id,
                    'address_id' => $address->id,
                    'action' => $address->wasRecentlyCreated ? 'created' : 'updated'
                ]);
            } else {
                // 創建新地址
                $address = $customer->addresses()->create(
                    Arr::except($addressData, ['id'])
                );
                
                Log::info('創建新地址', [
                    'customer_id' => $customer->id,
                    'address_id' => $address->id
                ]);
            }
        }

        Log::info('地址同步完成', [
            'customer_id' => $customer->id,
            'incoming_addresses_count' => count($addressesData),
            'deleted_addresses_count' => count($idsToDelete)
        ]);
    }

    /**
     * 驗證客戶數據完整性
     *
     * @param Customer $customer 要驗證的客戶實例
     * @return array 驗證結果
     */
    public function validateCustomerIntegrity(Customer $customer): array
    {
        $issues = [];

        // 檢查基本欄位
        if (empty($customer->name)) {
            $issues[] = '客戶姓名不能為空';
        }

        if (empty($customer->industry_type)) {
            $issues[] = '行業別不能為空';
        }

        if (empty($customer->payment_type)) {
            $issues[] = '付款類別不能為空';
        }

        // 檢查公司客戶的統一編號
        if ($customer->is_company && empty($customer->tax_id)) {
            $issues[] = '公司客戶必須有統一編號';
        }

        // 檢查預設地址邏輯
        $defaultAddressesCount = $customer->addresses()->where('is_default', true)->count();
        if ($defaultAddressesCount > 1) {
            $issues[] = '客戶有多個預設地址';
        }

        return [
            'is_valid' => empty($issues),
            'issues' => $issues
        ];
    }
} 