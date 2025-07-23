<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * 運行客戶數據播種器
     */
    public function run(): void
    {
        $customers = [
            [
                'name' => '王小明',
                'email' => 'xiaoming.wang@example.com',
                'phone' => '0912-345-678',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '個人客戶',
                'payment_type' => '現金',
                'contact_address' => '台北市信義區信義路五段7號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'normal',
                'is_priority_customer' => false,
                'addresses' => [
                    [
                        'address' => '台北市信義區信義路五段7號',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '李美麗',
                'email' => 'meili.li@example.com',
                'phone' => '0923-456-789',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '服飾零售',
                'payment_type' => '信用卡',
                'contact_address' => '新北市板橋區文化路一段188號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 15000,
                'priority_level' => 'normal',
                'is_priority_customer' => false,
                'addresses' => [
                    [
                        'address' => '新北市板橋區文化路一段188號',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '張大偉',
                'email' => 'dawei.zhang@example.com',
                'phone' => '0934-567-890',
                'is_company' => true,
                'tax_id' => '12345678',
                'industry_type' => '貿易批發',
                'payment_type' => '月結',
                'contact_address' => '台中市西屯區台灣大道三段99號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'high',
                'is_priority_customer' => true,
                'addresses' => [
                    [
                        'address' => '台中市西屯區台灣大道三段99號',
                        'is_default' => true,
                    ],
                    [
                        'address' => '台中市南屯區惠文路188號',
                        'is_default' => false,
                    ]
                ]
            ],
            [
                'name' => '陳淑芬',
                'email' => 'shufen.chen@example.com',
                'phone' => '0945-678-901',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '個人客戶',
                'payment_type' => '現金',
                'contact_address' => '高雄市前金區中正四路215號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'normal',
                'is_priority_customer' => false,
                'addresses' => [
                    [
                        'address' => '高雄市前金區中正四路215號',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '劉志強',
                'email' => 'zhiqiang.liu@example.com',
                'phone' => '0956-789-012',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '個人客戶',
                'payment_type' => '信用卡',
                'contact_address' => '桃園市桃園區中山路123號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'normal',
                'is_priority_customer' => false,
                'addresses' => [
                    [
                        'address' => '桃園市桃園區中山路123號',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '黃雅婷',
                'email' => 'yating.huang@example.com',
                'phone' => '0967-890-123',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '設計創意',
                'payment_type' => '信用卡',
                'contact_address' => '台南市中西區民權路二段158號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'normal',
                'is_priority_customer' => false,
                'addresses' => [
                    [
                        'address' => '台南市中西區民權路二段158號',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '趙建華',
                'email' => 'jianhua.zhao@example.com',
                'phone' => '0978-901-234',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '個人客戶',
                'payment_type' => '現金',
                'contact_address' => '新竹市東區光復路一段89號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'vip',
                'is_priority_customer' => true,
                'addresses' => [
                    [
                        'address' => '新竹市東區光復路一段89號',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '吳佩蓉',
                'email' => 'peirong.wu@example.com',
                'phone' => '0989-012-345',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '個人客戶',
                'payment_type' => '信用卡',
                'contact_address' => '基隆市中正區中正路777號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'normal',
                'is_priority_customer' => false,
                'addresses' => [
                    [
                        'address' => '基隆市中正區中正路777號',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '林俊傑',
                'email' => 'junjie.lin@example.com',
                'phone' => '0901-123-456',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '個人客戶',
                'payment_type' => '現金',
                'contact_address' => '彰化市中正路二段288號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'normal',
                'is_priority_customer' => false,
                'addresses' => [
                    [
                        'address' => '彰化市中正路二段288號',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '郭惠美',
                'email' => 'huimei.guo@example.com',
                'phone' => '0913-234-567',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '教育學術',
                'payment_type' => '現金',
                'contact_address' => '嘉義市西區學府路300號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'priority_level' => 'low',
                'is_priority_customer' => false,
                'addresses' => [
                    [
                        'address' => '嘉義市西區學府路300號',
                        'is_default' => true,
                    ]
                ]
            ],
        ];

        foreach ($customers as $customerData) {
            $addresses = $customerData['addresses'];
            unset($customerData['addresses']);

            $customer = Customer::create($customerData);

            // 建立客戶地址
            foreach ($addresses as $addressData) {
                CustomerAddress::create([
                    'customer_id' => $customer->id,
                    ...$addressData
                ]);
            }
        }

        echo "建立了 " . count($customers) . " 個客戶和相關地址資料\n";
    }
}