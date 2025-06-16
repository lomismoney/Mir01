<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ProductVariant;

/**
 * 商品變體權限策略類別
 * 
 * @description
 * 定義商品變體（SKU）相關操作的權限控制邏輯，
 * 基於用戶角色系統實現清晰的權限劃分。
 * 
 * 權限邏輯：
 * - 查看：所有已登入用戶都可以查看變體資訊
 * - 創建、更新、刪除：只有管理員可以執行這些操作
 * 
 * 根據技術規範要求，必須為每個模型建立專屬的 Policy 類別
 */
class ProductVariantPolicy
{
    /**
     * 判斷用戶是否可以查看任何變體
     * 
     * @description
     * 任何已登入用戶都可以查看變體列表，
     * 這對於庫存管理和銷售功能是必需的
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許查看變體列表
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * 判斷用戶是否可以查看指定變體
     * 
     * @description
     * 任何已登入用戶都可以查看單一變體的詳細資訊，
     * 這對於訂單處理和庫存查詢是必需的
     * 
     * @param User $user 當前用戶
     * @param ProductVariant $productVariant 變體實例
     * @return bool 是否允許查看該變體
     */
    public function view(User $user, ProductVariant $productVariant): bool
    {
        return true;
    }

    /**
     * 判斷用戶是否可以創建變體
     * 
     * @description
     * 只有管理員可以創建新的商品變體，
     * 因為這涉及到產品架構和定價策略
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許創建變體
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以更新變體
     * 
     * @description
     * 只有管理員可以更新變體資訊，包含：
     * - SKU 編碼調整
     * - 價格與成本修改
     * - 啟用狀態切換
     * - 物理規格更新
     * 
     * @param User $user 當前用戶
     * @param ProductVariant $productVariant 變體實例
     * @return bool 是否允許更新該變體
     */
    public function update(User $user, ProductVariant $productVariant): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以刪除變體
     * 
     * @description
     * 只有管理員可以刪除變體。
     * 注意：刪除變體是敏感操作，會影響庫存記錄和歷史訂單，
     * 建議在實際業務中考慮使用軟刪除或停用功能
     * 
     * @param User $user 當前用戶
     * @param ProductVariant $productVariant 變體實例
     * @return bool 是否允許刪除該變體
     */
    public function delete(User $user, ProductVariant $productVariant): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以批量刪除變體
     * 
     * @description
     * 只有管理員可以批量刪除變體，
     * 這是極為敏感的操作，需要額外謹慎
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許批量刪除變體
     */
    public function deleteAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以恢復已刪除的變體
     * 
     * @description
     * 只有管理員可以恢復已軟刪除的變體
     * 
     * @param User $user 當前用戶
     * @param ProductVariant $productVariant 變體實例
     * @return bool 是否允許恢復該變體
     */
    public function restore(User $user, ProductVariant $productVariant): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以永久刪除變體
     * 
     * @description
     * 只有管理員可以永久刪除變體，
     * 這將完全移除資料庫記錄，無法恢復
     * 
     * @param User $user 當前用戶
     * @param ProductVariant $productVariant 變體實例
     * @return bool 是否允許永久刪除該變體
     */
    public function forceDelete(User $user, ProductVariant $productVariant): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以切換變體狀態
     * 
     * @description
     * 自定義方法：處理變體啟用/停用操作
     * 只有管理員可以切換變體的啟用狀態
     * 
     * @param User $user 當前用戶
     * @param ProductVariant $productVariant 變體實例
     * @return bool 是否允許切換該變體狀態
     */
    public function toggleStatus(User $user, ProductVariant $productVariant): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以管理變體庫存
     * 
     * @description
     * 自定義方法：處理變體庫存調整權限
     * 管理員和檢視者都可以查看庫存，但只有管理員可以調整
     * 
     * @param User $user 當前用戶
     * @param ProductVariant $productVariant 變體實例
     * @return bool 是否允許管理該變體的庫存
     */
    public function manageInventory(User $user, ProductVariant $productVariant): bool
    {
        return $user->isAdmin();
    }
} 