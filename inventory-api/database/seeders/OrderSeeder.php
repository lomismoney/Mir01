<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\User;
use App\Enums\OrderItemType;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * 運行訂單數據播種器
     */
    public function run(): void
    {
        $customers = Customer::all();
        $users = User::all();
        $variants = ProductVariant::with('product')->get();

        if ($customers->isEmpty() || $users->isEmpty() || $variants->isEmpty()) {
            echo "警告：需要客戶、用戶和商品變體資料才能建立訂單\n";
            return;
        }

        $orderCount = 0;
        $itemCount = 0;

        // 建立各種狀態的訂單範例
        $orderScenarios = [
            // 1. 完全履行的現貨訂單
            [
                'type' => 'fully_fulfilled_stock',
                'customer' => $customers->random(),
                'items' => [
                    [
                        'type' => OrderItemType::STOCK,
                        'quantity' => 2,
                        'fulfilled_quantity' => 2,
                        'is_fulfilled' => true,
                    ],
                    [
                        'type' => OrderItemType::STOCK,
                        'quantity' => 1,
                        'fulfilled_quantity' => 1,
                        'is_fulfilled' => true,
                    ]
                ]
            ],

            // 2. 部分履行的混合訂單
            [
                'type' => 'partially_fulfilled_mixed',
                'customer' => $customers->random(),
                'items' => [
                    [
                        'type' => OrderItemType::STOCK,
                        'quantity' => 3,
                        'fulfilled_quantity' => 3,
                        'is_fulfilled' => true,
                    ],
                    [
                        'type' => OrderItemType::BACKORDER,
                        'quantity' => 2,
                        'fulfilled_quantity' => 1,
                        'is_fulfilled' => false,
                    ],
                    [
                        'type' => OrderItemType::CUSTOM,
                        'quantity' => 1,
                        'fulfilled_quantity' => 0,
                        'is_fulfilled' => false,
                    ]
                ]
            ],

            // 3. 全部為預訂商品的訂單
            [
                'type' => 'all_backorder',
                'customer' => $customers->random(),
                'items' => [
                    [
                        'type' => OrderItemType::BACKORDER,
                        'quantity' => 5,
                        'fulfilled_quantity' => 2,
                        'is_fulfilled' => false,
                    ],
                    [
                        'type' => OrderItemType::BACKORDER,
                        'quantity' => 3,
                        'fulfilled_quantity' => 0,
                        'is_fulfilled' => false,
                    ]
                ]
            ],

            // 4. 全部為訂製商品的訂單
            [
                'type' => 'all_custom',
                'customer' => $customers->random(),
                'items' => [
                    [
                        'type' => OrderItemType::CUSTOM,
                        'quantity' => 1,
                        'fulfilled_quantity' => 0,
                        'is_fulfilled' => false,
                        'custom_specs' => [
                            'color' => '客製化藍色',
                            'size' => '特殊尺寸',
                            'material' => '特殊材質',
                            'notes' => '客戶特殊需求'
                        ]
                    ],
                    [
                        'type' => OrderItemType::CUSTOM,
                        'quantity' => 2,
                        'fulfilled_quantity' => 1,
                        'is_fulfilled' => false,
                        'custom_specs' => [
                            'engraving' => '客製化雕刻文字',
                            'color' => '客製化紅色'
                        ]
                    ]
                ]
            ],

            // 5. 大量現貨訂單（企業客戶）
            [
                'type' => 'bulk_stock_order',
                'customer' => $customers->where('notes', 'like', '%企業%')->first() ?: $customers->random(),
                'items' => [
                    [
                        'type' => OrderItemType::STOCK,
                        'quantity' => 20,
                        'fulfilled_quantity' => 20,
                        'is_fulfilled' => true,
                    ],
                    [
                        'type' => OrderItemType::STOCK,
                        'quantity' => 15,
                        'fulfilled_quantity' => 10,
                        'is_fulfilled' => false,
                    ]
                ]
            ],

            // 6. 完全未履行的訂單
            [
                'type' => 'unfulfilled_order',
                'customer' => $customers->random(),
                'items' => [
                    [
                        'type' => OrderItemType::BACKORDER,
                        'quantity' => 2,
                        'fulfilled_quantity' => 0,
                        'is_fulfilled' => false,
                    ],
                    [
                        'type' => OrderItemType::CUSTOM,
                        'quantity' => 1,
                        'fulfilled_quantity' => 0,
                        'is_fulfilled' => false,
                        'custom_specs' => [
                            'special_request' => '緊急客製化需求',
                            'deadline' => '2024-12-31'
                        ]
                    ]
                ]
            ]
        ];

        // 建立場景範例訂單
        foreach ($orderScenarios as $scenario) {
            $order = $this->createOrder($scenario['customer'], $users->random());
            $orderCount++;

            foreach ($scenario['items'] as $itemData) {
                $variant = $this->selectVariantForType($variants, $itemData['type']);
                if ($variant) {
                    $orderItem = $this->createOrderItem($order, $variant, $itemData);
                    $itemCount++;
                }
            }

            $this->updateOrderTotals($order);
        }

        // 建立額外的隨機訂單
        for ($i = 0; $i < 15; $i++) {
            $customer = $customers->random();
            $user = $users->random();
            $order = $this->createOrder($customer, $user);
            $orderCount++;

            // 每個訂單隨機1-4個項目
            $itemsToCreate = rand(1, 4);
            for ($j = 0; $j < $itemsToCreate; $j++) {
                $variant = $variants->random();
                $itemType = $this->randomItemType();
                
                $itemData = [
                    'type' => $itemType,
                    'quantity' => rand(1, 8),
                    'fulfilled_quantity' => 0,
                    'is_fulfilled' => false,
                ];

                // 隨機設定履行狀態
                if ($itemType === OrderItemType::STOCK) {
                    // 現貨商品有80%機率完全履行
                    if (rand(1, 100) <= 80) {
                        $itemData['fulfilled_quantity'] = $itemData['quantity'];
                        $itemData['is_fulfilled'] = true;
                    }
                } else {
                    // 預訂和訂製商品有30%機率部分履行
                    if (rand(1, 100) <= 30) {
                        $itemData['fulfilled_quantity'] = rand(1, $itemData['quantity'] - 1);
                    }
                }

                // 訂製商品添加客製化規格
                if ($itemType === OrderItemType::CUSTOM) {
                    $itemData['custom_specs'] = $this->generateCustomSpecs();
                }

                $orderItem = $this->createOrderItem($order, $variant, $itemData);
                $itemCount++;
            }

            $this->updateOrderTotals($order);
        }

        echo "建立了 {$orderCount} 個訂單和 {$itemCount} 個訂單項目\n";
    }

    /**
     * 建立訂單
     */
    private function createOrder(Customer $customer, User $user): Order
    {
        $createdAt = now()->subDays(rand(0, 30))->subHours(rand(0, 23));
        
        $shippingStatuses = ['pending', 'processing', 'shipped', 'delivered'];
        $paymentStatuses = ['pending', 'paid', 'partially_paid', 'refunded'];
        
        return Order::create([
            'order_number' => $this->generateOrderNumber($createdAt),
            'customer_id' => $customer->id,
            'creator_user_id' => $user->id,
            'shipping_status' => $shippingStatuses[array_rand($shippingStatuses)],
            'payment_status' => $paymentStatuses[array_rand($paymentStatuses)],
            'subtotal' => 0, // 稍後計算
            'shipping_fee' => rand(0, 200) * 100, // 0-200元（以分為單位）
            'tax' => 0, // 稍後計算
            'discount_amount' => rand(0, 500) * 100, // 0-500元折扣（以分為單位）
            'grand_total' => 0, // 稍後計算
            'paid_amount' => 0, // 稍後設定
            'payment_method' => ['credit_card', 'cash', 'bank_transfer', 'pay_later'][array_rand(['credit_card', 'cash', 'bank_transfer', 'pay_later'])],
            'order_source' => ['online', 'store', 'phone', 'app'][array_rand(['online', 'store', 'phone', 'app'])],
            'shipping_address' => $this->generateShippingAddress($customer),
            'notes' => $this->generateOrderNotes(),
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    /**
     * 建立訂單項目
     */
    private function createOrderItem(Order $order, ProductVariant $variant, array $itemData): OrderItem
    {
        $itemType = $itemData['type'];
        $flags = $this->getItemTypeFlags($itemType);
        
        // 基本資料
        $orderItemData = [
            'order_id' => $order->id,
            'product_variant_id' => $itemType === OrderItemType::CUSTOM ? null : $variant->id,
            'is_stocked_sale' => $flags['is_stocked_sale'],
            'is_backorder' => $flags['is_backorder'],
            'product_name' => $variant->product->name,
            'sku' => $variant->sku,
            'price' => $variant->price,
            'cost' => $variant->cost_price ?: ($variant->price * 0.6),
            'quantity' => $itemData['quantity'],
            'fulfilled_quantity' => $itemData['fulfilled_quantity'],
            'tax_rate' => 5, // 5% 稅率
            'discount_amount' => rand(0, 100) * 100, // 0-100元的折扣（以分為單位）
            'is_fulfilled' => $itemData['is_fulfilled'],
            'fulfilled_at' => $itemData['is_fulfilled'] ? now() : null,
        ];

        // 訂製商品額外資料
        if ($itemType === OrderItemType::CUSTOM) {
            $orderItemData['custom_product_name'] = '客製化 ' . $variant->product->name;
            $orderItemData['custom_specifications'] = $itemData['custom_specs'] ?? null;
            $orderItemData['custom_product_specs'] = json_encode($itemData['custom_specs'] ?? []);
        }

        return OrderItem::create($orderItemData);
    }

    /**
     * 根據商品類型選擇合適的變體
     */
    private function selectVariantForType($variants, $itemType)
    {
        switch ($itemType) {
            case OrderItemType::STOCK:
                // 選擇價格較低的商品作為現貨（如T恤、配件等）
                return $variants->where('price', '<', 5000000)->random(); // 500元以下（分為單位）
            
            case OrderItemType::BACKORDER:
                // 選擇中高價商品作為預訂商品（如手機、筆電等）
                return $variants->where('price', '>=', 5000000)->random(); // 500元以上（分為單位）
            
            case OrderItemType::CUSTOM:
                // 任何商品都可以訂製
                return $variants->random();
            
            default:
                return $variants->random();
        }
    }

    /**
     * 獲取隨機商品類型
     */
    private function randomItemType(): string
    {
        $types = [
            OrderItemType::STOCK,
            OrderItemType::BACKORDER,
            OrderItemType::CUSTOM
        ];
        
        // 權重：現貨60%，預訂30%，訂製10%
        $weights = [60, 30, 10];
        $random = rand(1, 100);
        
        if ($random <= 60) return OrderItemType::STOCK;
        if ($random <= 90) return OrderItemType::BACKORDER;
        return OrderItemType::CUSTOM;
    }

    /**
     * 獲取商品類型標記
     */
    private function getItemTypeFlags($type): array
    {
        switch ($type) {
            case OrderItemType::STOCK:
                return ['is_stocked_sale' => true, 'is_backorder' => false];
            case OrderItemType::BACKORDER:
                return ['is_stocked_sale' => false, 'is_backorder' => true];
            case OrderItemType::CUSTOM:
                return ['is_stocked_sale' => false, 'is_backorder' => false];
            default:
                return ['is_stocked_sale' => false, 'is_backorder' => true];
        }
    }

    /**
     * 生成客製化規格
     */
    private function generateCustomSpecs(): array
    {
        $specs = [
            [
                'color' => '客製化顏色',
                'material' => '特殊材質',
                'notes' => '客戶特殊要求'
            ],
            [
                'engraving' => '客製化文字雕刻',
                'font' => '特殊字體',
                'position' => '背面中央'
            ],
            [
                'size' => '非標準尺寸',
                'measurements' => '長30cm x 寬20cm x 高10cm',
                'weight' => '500g'
            ],
            [
                'pattern' => '客製化圖案',
                'design_file' => 'custom_design.pdf',
                'deadline' => '2024-12-31'
            ]
        ];

        return $specs[array_rand($specs)];
    }

    /**
     * 生成訂單編號
     */
    private function generateOrderNumber($date): string
    {
        $prefix = 'ORD';
        $dateStr = $date->format('Ymd');
        $randomSuffix = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$dateStr}-{$randomSuffix}";
    }

    /**
     * 生成配送地址
     */
    private function generateShippingAddress(Customer $customer): string
    {
        $address = $customer->addresses()->where('is_default', true)->first();
        if ($address) {
            return json_encode([
                'name' => $address->contact_name,
                'phone' => $address->phone,
                'address' => $address->address,
                'city' => $address->city,
                'district' => $address->district,
                'postal_code' => $address->postal_code,
            ]);
        }

        return json_encode([
            'name' => $customer->name,
            'phone' => $customer->phone,
            'address' => '預設地址',
            'city' => '台北市',
            'district' => '信義區',
            'postal_code' => '110',
        ]);
    }

    /**
     * 生成訂單備註
     */
    private function generateOrderNotes(): string
    {
        $notes = [
            '客戶要求盡快出貨',
            '禮品包裝',
            '上午配送',
            '請勿按門鈴',
            '大樓管理室代收',
            '急件處理',
            '客戶生日禮物',
            '公司採購',
            '請小心包裝',
            '需要發票',
            null, // 有些訂單沒有備註
            null,
            null,
        ];

        return $notes[array_rand($notes)];
    }

    /**
     * 更新訂單總計金額
     */
    private function updateOrderTotals(Order $order): void
    {
        $items = $order->items;
        
        $subtotal = $items->sum(function($item) {
            return ($item->price * $item->quantity) - $item->discount_amount;
        });
        
        $tax = (int)round($subtotal * 0.05); // 5% 稅率（以分為單位）
        $grandTotal = $subtotal + $tax + $order->shipping_fee - $order->discount_amount;
        
        // 設定已付金額
        $paidAmount = 0;
        if ($order->payment_status === 'paid') {
            $paidAmount = $grandTotal;
        } elseif ($order->payment_status === 'partially_paid') {
            $paidAmount = (int)round($grandTotal * 0.5); // 付了一半（以分為單位）
        }

        $order->update([
            'subtotal' => $subtotal,
            'tax' => $tax,
            'grand_total' => $grandTotal,
            'paid_amount' => $paidAmount,
        ]);
    }
}