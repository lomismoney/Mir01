<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🚀 開始建立測試資料...');
        
        $this->call([
            // 基礎資料
            RolePermissionSeeder::class, // 角色與權限（必須先建立）
            UserSeeder::class,
            StoreSeeder::class, 
            UserStoreSeeder::class,
            
            // 商品基礎資料
            CategorySeeder::class, // 商品分類
            AttributeSeeder::class, // 商品屬性
            
            // 商品和庫存資料
            TestInventorySeeder::class, // 包含商品、變體、庫存和進貨單
            InventoryTransferSeeder::class, // 新增更多庫存轉移測試資料
            
            // 客戶資料
            CustomerSeeder::class, // 已修復欄位問題
            
            // 訂單資料（包含稅務測試場景）
            OrderSeeder::class, // 含稅/不含稅、不同稅率的測試訂單
            
            // 進貨單與訂單關聯
            PurchaseOrderLinkSeeder::class, // 建立進貨項目與訂單項目的關聯
            
            // 訂單相關資料
            PaymentRecordSeeder::class, // 付款記錄
            OrderStatusHistorySeeder::class, // 訂單狀態歷史
            InstallationSeeder::class, // 安裝單管理
            RefundSeeder::class, // 退款管理
            
            // 銷售資料
            SaleSeeder::class, // POS銷售記錄
            
            // 低庫存預警場景
            LowStockScenarioSeeder::class, // 建立低庫存測試場景
            
            // 時序數據（可選，執行時間較長）
            // TimeSeriesDataSeeder::class, // 6個月歷史數據，用於報表測試
        ]);
        
        $this->command->info('✅ 所有測試資料建立完成！');
        $this->command->info('');
        $this->command->info('📊 資料摘要：');
        $this->command->info('   - 用戶和門市：基礎設定完成');
        $this->command->info('   - 角色權限：6種角色與細部權限設定');
        $this->command->info('   - 屬性系統：12種屬性類型，超過100個屬性值');
        $this->command->info('   - 商品系統：6個商品類別，多個商品變體');
        $this->command->info('   - 庫存系統：完整庫存記錄，包含各種異動歷史');
        $this->command->info('   - 轉移系統：多種庫存轉移場景（完成、運輸中、待處理、已取消）');
        $this->command->info('   - 客戶系統：10個測試客戶，包含地址資料');
        $this->command->info('   - 訂單系統：各種履行狀態的訂單項目');
        $this->command->info('   - 進貨系統：關聯訂單的進貨單，支援部分履行');
        $this->command->info('   - 付款系統：完整付款記錄，支援部分付款');
        $this->command->info('   - 安裝系統：安裝單管理，包含安裝師傅排程');
        $this->command->info('   - 退款系統：各種退款場景，庫存回補處理');
        $this->command->info('   - 銷售系統：POS銷售記錄，多種付款方式');
        $this->command->info('   - 預警系統：低庫存和零庫存的測試場景');
        $this->command->info('');
        $this->command->info('🎯 可以測試的功能：');
        $this->command->info('   ✓ 三種商品類型（現貨、預訂、訂製）');
        $this->command->info('   ✓ 部分履行和完全履行狀態');
        $this->command->info('   ✓ 庫存預警和健康度評分');
        $this->command->info('   ✓ 庫存轉移管理（各種狀態和轉移原因）');
        $this->command->info('   ✓ 進貨單與訂單項目關聯追蹤');
        $this->command->info('   ✓ 庫存異動歷史和統計分析');
        $this->command->info('   ✓ 稅務計算（含稅/不含稅、多種稅率）');
        $this->command->info('   ✓ 訂單狀態追蹤和歷史記錄');
        $this->command->info('   ✓ 安裝排程和進度管理');
        $this->command->info('   ✓ 退款流程和庫存回補');
        $this->command->info('   ✓ POS銷售和多元付款方式');
        $this->command->info('');
        $this->command->info('💡 提示：如需建立6個月歷史數據，請取消註解 TimeSeriesDataSeeder');
    }
}
