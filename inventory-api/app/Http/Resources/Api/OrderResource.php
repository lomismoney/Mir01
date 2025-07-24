<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'creator_user_id' => $this->creator_user_id,
            'shipping_status' => $this->shipping_status,
            'payment_status' => $this->payment_status,
            'subtotal' => $this->getRawOriginal('subtotal') / 100, // 分轉元（使用原始資料庫值）
            'shipping_fee' => $this->getRawOriginal('shipping_fee') / 100, // 分轉元（使用原始資料庫值）
            'tax' => $this->getRawOriginal('tax') / 100, // 分轉元（使用原始資料庫值）
            'discount_amount' => $this->getRawOriginal('discount_amount') / 100, // 分轉元（使用原始資料庫值）
            'grand_total' => $this->getRawOriginal('grand_total') / 100, // 分轉元（使用原始資料庫值）
            'paid_amount' => $this->getRawOriginal('paid_amount') / 100, // 分轉元（使用原始資料庫值）
            'is_tax_inclusive' => $this->is_tax_inclusive,
            'tax_rate' => $this->tax_rate,
            'payment_method' => $this->payment_method,
            'order_source' => $this->order_source,
            'shipping_address' => $this->shipping_address,
            'notes' => $this->notes,
            'tracking_number' => $this->tracking_number,
            'carrier' => $this->carrier,
            'shipped_at' => $this->shipped_at,
            'paid_at' => $this->paid_at,
            'estimated_delivery_date' => $this->estimated_delivery_date,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // 🎯 新增：是否包含訂製商品的標記
            'has_custom_items' => $this->has_custom_items,
            
            // 關聯資源 - 使用專門的 Resource 類
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payment_records' => PaymentRecordResource::collection($this->whenLoaded('paymentRecords')),
            'refunds' => RefundResource::collection($this->whenLoaded('refunds')),
            'status_histories' => OrderStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
        ];
    }
}
