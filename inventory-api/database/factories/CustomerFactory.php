<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Customer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isCompany = $this->faker->boolean(30); // 30% 機率是公司客戶

        return [
            'name' => $isCompany ? $this->faker->company() : $this->faker->name(),
            'phone' => $this->faker->optional(0.8)->phoneNumber(), // 80% 機率有電話
            'is_company' => $isCompany,
            'tax_id' => $isCompany ? $this->faker->numerify('########') : null,
            'industry_type' => $this->faker->randomElement([
                '設計師',
                '科技業',
                '製造業',
                '餐飲業',
                '零售業',
                '服務業',
                '建築業',
                '金融業',
                '教育業',
                '醫療業'
            ]),
            'payment_type' => $this->faker->randomElement([
                '現金付款',
                '轉帳付款',
                '月結30天',
                '月結60天',
                '貨到付款',
                '信用卡'
            ]),
            'contact_address' => $this->faker->optional(0.7)->address(), // 70% 機率有聯絡地址
            'total_unpaid_amount' => 0,
            'total_completed_amount' => 0,
        ];
    }

    /**
     * 指定為個人客戶
     */
    public function individual(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => $this->faker->name(),
            'is_company' => false,
            'tax_id' => null,
        ]);
    }

    /**
     * 指定為公司客戶
     */
    public function company(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => $this->faker->company(),
            'is_company' => true,
            'tax_id' => $this->faker->numerify('########'),
        ]);
    }

    /**
     * 設定特定的行業類別
     */
    public function industry(string $industry): static
    {
        return $this->state(fn (array $attributes) => [
            'industry_type' => $industry,
        ]);
    }

    /**
     * 設定特定的付款方式
     */
    public function paymentType(string $paymentType): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_type' => $paymentType,
        ]);
    }

    /**
     * 設定有電話號碼
     */
    public function withPhone(): static
    {
        return $this->state(fn (array $attributes) => [
            'phone' => $this->faker->phoneNumber(),
        ]);
    }

    /**
     * 設定有聯絡地址
     */
    public function withContactAddress(): static
    {
        return $this->state(fn (array $attributes) => [
            'contact_address' => $this->faker->address(),
        ]);
    }

    /**
     * 設定有總金額
     */
    public function withAmounts(float $unpaid = null, float $completed = null): static
    {
        return $this->state(fn (array $attributes) => [
            'total_unpaid_amount' => $unpaid ?? $this->faker->randomFloat(2, 0, 50000),
            'total_completed_amount' => $completed ?? $this->faker->randomFloat(2, 0, 100000),
        ]);
    }
} 