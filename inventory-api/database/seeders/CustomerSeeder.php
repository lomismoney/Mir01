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
                'phone' => '0912-345-678',
                'is_company' => false,
                'tax_id' => null,
                'industry_type' => '個人客戶',
                'payment_type' => '現金',
                'contact_address' => '台北市信義區信義路五段7號',
                'total_unpaid_amount' => 0,
                'total_completed_amount' => 0,
                'addresses' => [
                    [
                        'type' => 'home',
                        'contact_name' => '王小明',
                        'phone' => '0912-345-678',
                        'address' => '台北市信義區信義路五段7號',
                        'city' => '台北市',
                        'district' => '信義區',
                        'postal_code' => '110',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '李美麗',
                'email' => 'meili.li@example.com',
                'phone' => '0923-456-789',
                'birthday' => '1990-08-22',
                'gender' => 'female',
                'notes' => '喜歡購買服飾配件',
                'addresses' => [
                    [
                        'type' => 'office',
                        'contact_name' => '李美麗',
                        'phone' => '0923-456-789',
                        'address' => '新北市板橋區文化路一段188號',
                        'city' => '新北市',
                        'district' => '板橋區',
                        'postal_code' => '220',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '張大偉',
                'email' => 'dawei.zhang@example.com',
                'phone' => '0934-567-890',
                'birthday' => '1978-12-03',
                'gender' => 'male',
                'notes' => '企業客戶，經常大量採購辦公用品',
                'addresses' => [
                    [
                        'type' => 'company',
                        'contact_name' => '張大偉',
                        'phone' => '0934-567-890',
                        'address' => '台中市西屯區台灣大道三段99號',
                        'city' => '台中市',
                        'district' => '西屯區',
                        'postal_code' => '407',
                        'is_default' => true,
                    ],
                    [
                        'type' => 'home',
                        'contact_name' => '張大偉',
                        'phone' => '0934-567-890',
                        'address' => '台中市南屯區惠文路188號',
                        'city' => '台中市',
                        'district' => '南屯區',
                        'postal_code' => '408',
                        'is_default' => false,
                    ]
                ]
            ],
            [
                'name' => '陳淑芬',
                'email' => 'shufen.chen@example.com',
                'phone' => '0945-678-901',
                'birthday' => '1995-03-18',
                'gender' => 'female',
                'notes' => '年輕客戶，經常關注最新科技產品',
                'addresses' => [
                    [
                        'type' => 'home',
                        'contact_name' => '陳淑芬',
                        'phone' => '0945-678-901',
                        'address' => '高雄市前金區中正四路215號',
                        'city' => '高雄市',
                        'district' => '前金區',
                        'postal_code' => '801',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '劉志強',
                'email' => 'zhiqiang.liu@example.com',
                'phone' => '0956-789-012',
                'birthday' => '1982-11-25',
                'gender' => 'male',
                'notes' => '喜歡購買運動相關產品',
                'addresses' => [
                    [
                        'type' => 'home',
                        'contact_name' => '劉志強',
                        'phone' => '0956-789-012',
                        'address' => '桃園市桃園區中山路123號',
                        'city' => '桃園市',
                        'district' => '桃園區',
                        'postal_code' => '330',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '黃雅婷',
                'email' => 'yating.huang@example.com',
                'phone' => '0967-890-123',
                'birthday' => '1988-07-10',
                'gender' => 'female',
                'notes' => '設計師，對美學產品有高要求',
                'addresses' => [
                    [
                        'type' => 'home',
                        'contact_name' => '黃雅婷',
                        'phone' => '0967-890-123',
                        'address' => '台南市中西區民權路二段158號',
                        'city' => '台南市',
                        'district' => '中西區',
                        'postal_code' => '700',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '趙建華',
                'email' => 'jianhua.zhao@example.com',
                'phone' => '0978-901-234',
                'birthday' => '1975-01-28',
                'gender' => 'male',
                'notes' => '資深客戶，購買力強',
                'addresses' => [
                    [
                        'type' => 'home',
                        'contact_name' => '趙建華',
                        'phone' => '0978-901-234',
                        'address' => '新竹市東區光復路一段89號',
                        'city' => '新竹市',
                        'district' => '東區',
                        'postal_code' => '300',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '吳佩蓉',
                'email' => 'peirong.wu@example.com',
                'phone' => '0989-012-345',
                'birthday' => '1992-09-14',
                'gender' => 'female',
                'notes' => '喜歡網路購物，經常使用優惠券',
                'addresses' => [
                    [
                        'type' => 'home',
                        'contact_name' => '吳佩蓉',
                        'phone' => '0989-012-345',
                        'address' => '基隆市中正區中正路777號',
                        'city' => '基隆市',
                        'district' => '中正區',
                        'postal_code' => '202',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '林俊傑',
                'email' => 'junjie.lin@example.com',
                'phone' => '0901-123-456',
                'birthday' => '1987-04-05',
                'gender' => 'male',
                'notes' => '音樂愛好者，經常購買音響設備',
                'addresses' => [
                    [
                        'type' => 'home',
                        'contact_name' => '林俊傑',
                        'phone' => '0901-123-456',
                        'address' => '彰化市中正路二段288號',
                        'city' => '彰化市',
                        'district' => '中正區',
                        'postal_code' => '500',
                        'is_default' => true,
                    ]
                ]
            ],
            [
                'name' => '郭惠美',
                'email' => 'huimei.guo@example.com',
                'phone' => '0913-234-567',
                'birthday' => '1993-06-30',
                'gender' => 'female',
                'notes' => '學生客戶，預算有限但忠誠度高',
                'addresses' => [
                    [
                        'type' => 'school',
                        'contact_name' => '郭惠美',
                        'phone' => '0913-234-567',
                        'address' => '嘉義市西區學府路300號',
                        'city' => '嘉義市',
                        'district' => '西區',
                        'postal_code' => '600',
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