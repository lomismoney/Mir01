<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\DataCollection;
use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\WithCast;
use App\Data\Casts\MoneyCast;
use Illuminate\Support\Carbon;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\Exists;
use App\Models\Purchase;
use Spatie\LaravelData\Support\Validation\ValidationContext;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;

class PurchaseData extends Data
{
    public function __construct(
        #[Rule(['required', 'integer'])]
        #[Exists('stores', 'id')]
        public int $store_id,

        #[Rule(['nullable', 'string', 'max:255', 'unique:purchases,order_number'])]
        public ?string $order_number,

        #[WithCast(MoneyCast::class)]
        #[Rule(['required', 'numeric', 'min:0'])]
        public int $shipping_cost,

        #[Rule(['required', 'array'])]
        #[DataCollectionOf(PurchaseItemData::class)]
        public DataCollection $items,

        #[Rule(['nullable', 'string', 'in:' . Purchase::STATUS_PENDING . ',' . Purchase::STATUS_CONFIRMED . ',' . Purchase::STATUS_IN_TRANSIT . ',' . Purchase::STATUS_RECEIVED . ',' . Purchase::STATUS_COMPLETED . ',' . Purchase::STATUS_CANCELLED . ',' . Purchase::STATUS_PARTIALLY_RECEIVED])]
        public ?string $status,

        #[WithCast(DateTimeInterfaceCast::class, format: ['Y-m-d\TH:i:s.u\Z', 'Y-m-d\TH:i:s\Z', 'Y-m-d\TH:i:sP'])]
        #[Rule(['nullable', 'date'])]
        public ?Carbon $purchased_at,
        
        #[Rule(['nullable', 'string'])]
        public ?string $notes,
        
        #[Rule(['nullable', 'array'])]
        #[DataCollectionOf(OrderItemBindingData::class)]
        public ?DataCollection $order_items,
    ) {}
    
    /**
     * 自定義驗證規則
     * 確保至少有 items 或 order_items 其中之一
     */
    public static function rules(ValidationContext $context): array
    {
        return [
            'items' => function ($attribute, $value, $fail) use ($context) {
                $orderItems = $context->payload['order_items'] ?? [];
                
                // 如果 items 為空且 order_items 也為空，則驗證失敗
                if (empty($value) && empty($orderItems)) {
                    $fail('至少需要一個進貨項目或待進貨訂單項目。');
                }
            },
        ];
    }
}
