<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
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
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'is_company' => $this->is_company,
            'tax_id' => $this->tax_id,
            'industry_type' => $this->industry_type,
            'payment_type' => $this->payment_type,
            'contact_address' => $this->contact_address,
            'total_unpaid_amount' => $this->total_unpaid_amount,
            'total_completed_amount' => $this->total_completed_amount,
            'addresses' => $this->whenLoaded('addresses', function () {
                return $this->addresses->map(function ($address) {
                    return [
                        'id' => $address->id,
                        'customer_id' => $address->customer_id,
                        'address' => $address->address,
                        'is_default' => $address->is_default,
                        'created_at' => $address->created_at,
                        'updated_at' => $address->updated_at,
                    ];
                });
            }),
            'default_address' => $this->whenLoaded('defaultAddress', function () {
                return $this->defaultAddress ? [
                    'id' => $this->defaultAddress->id,
                    'customer_id' => $this->defaultAddress->customer_id,
                    'address' => $this->defaultAddress->address,
                    'is_default' => $this->defaultAddress->is_default,
                    'created_at' => $this->defaultAddress->created_at,
                    'updated_at' => $this->defaultAddress->updated_at,
                ] : null;
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
