<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;

class TestInventorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 獲取第一個用戶（或創建一個測試用戶）
        $user = User::first();
        if (!$user) {
            $this->command->error('No user found. Please run UserSeeder first.');
            return;
        }

        // 獲取第一個商品變體
        $variant = ProductVariant::first();
        if (!$variant) {
            $this->command->error('No product variant found. Please create products first.');
            return;
        }

        // 獲取第一個門市
        $store = Store::first();
        if (!$store) {
            $this->command->error('No store found. Please create stores first.');
            return;
        }

        // 創建或獲取庫存記錄
        $inventory = Inventory::firstOrCreate(
            [
                'product_variant_id' => $variant->id,
                'store_id' => $store->id,
            ],
            [
                'quantity' => 0,
                'low_stock_threshold' => 10,
            ]
        );

        $this->command->info("Working with Inventory ID: {$inventory->id}");

        // 創建一些交易歷史
        // 1. 初始入庫
        $inventory->addStock(100, $user->id, '初始庫存', ['source' => 'initial_stock']);
        $this->command->info('Added initial stock of 100');

        // 2. 銷售出庫
        $inventory->reduceStock(20, $user->id, '銷售訂單 #001', ['order_id' => '001']);
        $this->command->info('Reduced stock by 20 (sale)');

        // 3. 庫存調整
        $inventory->setStock(75, $user->id, '盤點調整', ['reason' => 'inventory_count']);
        $this->command->info('Adjusted stock to 75');

        // 4. 再次入庫
        $inventory->addStock(50, $user->id, '補貨入庫', ['purchase_order' => 'PO-002']);
        $this->command->info('Added 50 more stock');

        $this->command->info("Test inventory data created successfully!");
        $this->command->info("Inventory ID: {$inventory->id}");
        $this->command->info("Product: {$variant->product->name} (SKU: {$variant->sku})");
        $this->command->info("Store: {$store->name}");
        $this->command->info("Current quantity: {$inventory->fresh()->quantity}");
        $this->command->info("Transaction count: {$inventory->transactions()->count()}");
    }
} 