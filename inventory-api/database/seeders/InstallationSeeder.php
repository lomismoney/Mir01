<?php

namespace Database\Seeders;

use App\Models\Installation;
use App\Models\InstallationItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Store;
use Illuminate\Database\Seeder;

class InstallationSeeder extends Seeder
{
    /**
     * 運行安裝單數據播種器
     */
    public function run(): void
    {
        // 建立安裝師傅用戶
        $installers = $this->createInstallers();
        
        // 獲取需要安裝的訂單項目
        $ordersWithInstallation = $this->getOrdersRequiringInstallation();
        
        if ($ordersWithInstallation->isEmpty()) {
            echo "警告：沒有找到需要安裝的訂單項目\n";
            return;
        }
        
        $installationCount = 0;
        $itemCount = 0;
        
        // 為需要安裝的訂單建立安裝單
        foreach ($ordersWithInstallation as $order) {
            $installer = $installers->random();
            $creator = User::inRandomOrder()->first();
            
            // 建立安裝單
            $installation = $this->createInstallation($order, $installer, $creator);
            $installationCount++;
            
            // 建立安裝項目
            $installableItems = $this->getInstallableItems($order);
            foreach ($installableItems as $orderItem) {
                $this->createInstallationItem($installation, $orderItem);
                $itemCount++;
            }
            
            // 根據狀態更新時間戳
            $this->updateInstallationTimestamps($installation);
        }
        
        // 建立一些獨立的安裝單（不關聯訂單）
        $standaloneCount = $this->createStandaloneInstallations($installers);
        $installationCount += $standaloneCount;
        
        echo "建立了 {$installationCount} 個安裝單和 {$itemCount} 個安裝項目\n";
        echo "其中包含 {$standaloneCount} 個獨立安裝單\n";
    }
    
    /**
     * 建立安裝師傅用戶
     */
    private function createInstallers(): \Illuminate\Support\Collection
    {
        $installerNames = [
            '李師傅',
            '王師傅',
            '張師傅',
            '陳師傅'
        ];
        
        $installers = collect();
        $stores = Store::all();
        
        foreach ($installerNames as $name) {
            $username = strtolower(str_replace('師傅', '', $name)) . '.installer';
            $installer = User::firstOrCreate(
                ['username' => $username],
                [
                    'name' => $name,
                    'email' => $username . '@example.com',
                    'password' => bcrypt('password'),
                ]
            );
            
            // 分配到隨機門市
            if ($stores->isNotEmpty()) {
                $installer->stores()->syncWithoutDetaching([$stores->random()->id]);
            }
            
            $installers->push($installer);
        }
        
        echo "建立了 " . $installers->count() . " 個安裝師傅帳號\n";
        
        return $installers;
    }
    
    /**
     * 獲取需要安裝的訂單
     */
    private function getOrdersRequiringInstallation()
    {
        // 選擇一些訂單來建立安裝單
        // 優先選擇包含大型商品的訂單（如辦公椅）
        return Order::whereHas('items', function($query) {
            $query->whereHas('productVariant.product', function($q) {
                $q->where('name', 'like', '%椅%')
                  ->orWhere('name', 'like', '%桌%')
                  ->orWhere('name', 'like', '%櫃%');
            });
        })->limit(8)->get();
    }
    
    /**
     * 建立安裝單
     */
    private function createInstallation(Order $order, User $installer, User $creator): Installation
    {
        $statuses = ['pending', 'scheduled', 'in_progress', 'completed'];
        $status = $statuses[array_rand($statuses)];
        
        // 生成安裝單號
        $installationNumber = $this->generateInstallationNumber();
        
        // 設定排程日期
        $scheduledDate = null;
        if (in_array($status, ['scheduled', 'in_progress', 'completed'])) {
            $scheduledDate = now()->addDays(rand(-10, 10));
        }
        
        // 從訂單獲取客戶資訊
        $customer = $order->customer;
        $shippingAddress = json_decode($order->shipping_address, true);
        
        return Installation::create([
            'installation_number' => $installationNumber,
            'order_id' => $order->id,
            'installer_user_id' => $installer->id,
            'created_by' => $creator->id,
            'customer_name' => $customer->name ?? '未知客戶',
            'customer_phone' => $customer->phone ?? $shippingAddress['phone'] ?? '0900000000',
            'installation_address' => $shippingAddress['address'] ?? '預設地址',
            'status' => $status,
            'scheduled_date' => $scheduledDate,
            'notes' => $this->generateInstallationNotes($status),
        ]);
    }
    
    /**
     * 獲取訂單中需要安裝的項目
     */
    private function getInstallableItems(Order $order)
    {
        // 選擇大型商品作為需要安裝的項目
        return $order->items()->whereHas('productVariant.product', function($q) {
            $q->where('name', 'like', '%椅%')
              ->orWhere('name', 'like', '%桌%')
              ->orWhere('name', 'like', '%櫃%');
        })->get();
    }
    
    /**
     * 建立安裝項目
     */
    private function createInstallationItem(Installation $installation, OrderItem $orderItem): InstallationItem
    {
        $statuses = ['pending', 'completed'];
        
        // 如果安裝單已完成，項目也應該完成
        if ($installation->status === 'completed') {
            $status = 'completed';
        } elseif ($installation->status === 'in_progress') {
            // 進行中的安裝單，隨機一些項目已完成
            $status = rand(0, 100) < 50 ? 'completed' : 'pending';
        } else {
            $status = 'pending';
        }
        
        return InstallationItem::create([
            'installation_id' => $installation->id,
            'order_item_id' => $orderItem->id,
            'product_variant_id' => $orderItem->product_variant_id,
            'product_name' => $orderItem->product_name,
            'sku' => $orderItem->sku,
            'quantity' => $orderItem->quantity,
            'specifications' => $this->generateSpecifications($orderItem),
            'status' => $status,
            'notes' => $this->generateItemNotes($status),
        ]);
    }
    
    /**
     * 更新安裝單時間戳
     */
    private function updateInstallationTimestamps(Installation $installation): void
    {
        if ($installation->status === 'in_progress') {
            $installation->update([
                'actual_start_time' => now()->subHours(rand(1, 4)),
            ]);
        } elseif ($installation->status === 'completed') {
            $startTime = now()->subHours(rand(5, 8));
            $installation->update([
                'actual_start_time' => $startTime,
                'actual_end_time' => $startTime->copy()->addHours(rand(2, 4)),
            ]);
        }
    }
    
    /**
     * 建立獨立的安裝單（不關聯訂單）
     */
    private function createStandaloneInstallations($installers): int
    {
        $count = 0;
        $creator = User::first();
        
        // 建立 3-5 個獨立安裝單
        $standaloneCount = rand(3, 5);
        
        for ($i = 0; $i < $standaloneCount; $i++) {
            $installer = $installers->random();
            $status = ['pending', 'scheduled', 'in_progress', 'completed'][array_rand(['pending', 'scheduled', 'in_progress', 'completed'])];
            
            $scheduledDate = null;
            if (in_array($status, ['scheduled', 'in_progress', 'completed'])) {
                $scheduledDate = now()->addDays(rand(-5, 15));
            }
            
            $installation = Installation::create([
                'installation_number' => $this->generateInstallationNumber(),
                'order_id' => null,
                'installer_user_id' => $installer->id,
                'created_by' => $creator->id,
                'customer_name' => '獨立客戶' . ($i + 1),
                'customer_phone' => '09' . rand(10000000, 99999999),
                'installation_address' => $this->generateAddress(),
                'status' => $status,
                'scheduled_date' => $scheduledDate,
                'notes' => '獨立安裝服務 - ' . $this->generateInstallationNotes($status),
            ]);
            
            // 為獨立安裝單建立項目
            $itemCount = rand(1, 3);
            for ($j = 0; $j < $itemCount; $j++) {
                $this->createStandaloneInstallationItem($installation);
            }
            
            $this->updateInstallationTimestamps($installation);
            $count++;
        }
        
        return $count;
    }
    
    /**
     * 建立獨立安裝項目
     */
    private function createStandaloneInstallationItem(Installation $installation): void
    {
        $products = [
            ['name' => '客製化辦公桌', 'sku' => 'CUSTOM-DESK-001'],
            ['name' => '系統櫃組裝', 'sku' => 'CUSTOM-CABINET-001'],
            ['name' => '壁掛式白板', 'sku' => 'WHITEBOARD-WALL-001'],
            ['name' => '投影機架設', 'sku' => 'PROJECTOR-INSTALL-001'],
        ];
        
        $product = $products[array_rand($products)];
        $status = $installation->status === 'completed' ? 'completed' : 'pending';
        
        InstallationItem::create([
            'installation_id' => $installation->id,
            'order_item_id' => null,
            'product_variant_id' => null,
            'product_name' => $product['name'],
            'sku' => $product['sku'],
            'quantity' => rand(1, 2),
            'specifications' => '客製化規格',
            'status' => $status,
            'notes' => '獨立安裝項目',
        ]);
    }
    
    /**
     * 生成安裝單號
     */
    private function generateInstallationNumber(): string
    {
        $prefix = 'INST';
        $date = now()->format('Ymd');
        $sequence = str_pad(Installation::whereDate('created_at', now())->count() + 1, 4, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$date}-{$sequence}";
    }
    
    /**
     * 生成安裝地址
     */
    private function generateAddress(): string
    {
        $cities = ['台北市', '新北市', '桃園市', '台中市', '高雄市'];
        $districts = ['信義區', '大安區', '中山區', '內湖區', '士林區'];
        $streets = ['忠孝東路', '信義路', '民生東路', '南京東路', '仁愛路'];
        
        $city = $cities[array_rand($cities)];
        $district = $districts[array_rand($districts)];
        $street = $streets[array_rand($streets)];
        $number = rand(1, 500);
        $floor = rand(1, 15);
        
        return "{$city}{$district}{$street}{$number}號{$floor}樓";
    }
    
    /**
     * 生成安裝規格
     */
    private function generateSpecifications($orderItem): string
    {
        $specs = [
            '標準安裝',
            '需要拆除舊設備',
            '需要搬運上樓',
            '需要特殊工具',
            '客製化調整',
        ];
        
        return $specs[array_rand($specs)];
    }
    
    /**
     * 生成安裝單備註
     */
    private function generateInstallationNotes($status): string
    {
        $notes = [
            'pending' => [
                '等待客戶確認時間',
                '需要聯繫客戶排程',
                '等待貨物到齊',
            ],
            'scheduled' => [
                '已與客戶確認時間',
                '客戶要求上午安裝',
                '需要兩位師傅配合',
            ],
            'in_progress' => [
                '正在進行安裝作業',
                '客戶在現場監督',
                '預計2小時完成',
            ],
            'completed' => [
                '安裝完成，客戶滿意',
                '已完成測試和調整',
                '客戶已簽收確認',
            ],
        ];
        
        return $notes[$status][array_rand($notes[$status])];
    }
    
    /**
     * 生成安裝項目備註
     */
    private function generateItemNotes($status): string
    {
        $notes = [
            'pending' => [
                '待安裝',
                '需要特殊處理',
                '客戶要求最後安裝',
            ],
            'completed' => [
                '已完成安裝',
                '功能測試正常',
                '客戶已確認',
            ],
        ];
        
        return $notes[$status][array_rand($notes[$status])];
    }
}