<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CustomerAddress>
 */
class CustomerAddressFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = CustomerAddress::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'address' => $this->faker->address(),
            'is_default' => false, // 預設不是預設地址，避免衝突
        ];
    }

    /**
     * 設定為預設地址
     */
    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }

    /**
     * 設定非預設地址
     */
    public function notDefault(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => false,
        ]);
    }

    /**
     * 設定屬於特定客戶
     */
    public function forCustomer(Customer $customer): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_id' => $customer->id,
        ]);
    }

    /**
     * 設定特定地址內容
     */
    public function withAddress(string $address): static
    {
        return $this->state(fn (array $attributes) => [
            'address' => $address,
        ]);
    }

    /**
     * 創建台北地址
     */
    public function taipei(): static
    {
        $districts = [
            '中正區', '大同區', '中山區', '松山區', '大安區',
            '萬華區', '信義區', '士林區', '北投區', '內湖區',
            '南港區', '文山區'
        ];

        $roads = [
            '忠孝東路', '信義路', '仁愛路', '敦化南路', '復興南路',
            '建國南路', '羅斯福路', '重慶南路', '中山北路', '民生東路'
        ];

        return $this->state(fn (array $attributes) => [
            'address' => sprintf(
                '台北市%s%s%d號',
                $this->faker->randomElement($districts),
                $this->faker->randomElement($roads),
                $this->faker->numberBetween(1, 999)
            ),
        ]);
    }

    /**
     * 創建新北地址
     */
    public function newTaipei(): static
    {
        $districts = [
            '板橋區', '三重區', '中和區', '永和區', '新莊區',
            '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區',
            '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區'
        ];

        return $this->state(fn (array $attributes) => [
            'address' => sprintf(
                '新北市%s%s%d號',
                $this->faker->randomElement($districts),
                $this->faker->streetName(),
                $this->faker->numberBetween(1, 999)
            ),
        ]);
    }

    /**
     * 創建桃園地址
     */
    public function taoyuan(): static
    {
        $districts = [
            '桃園區', '中壢區', '大溪區', '楊梅區', '蘆竹區',
            '大園區', '龜山區', '八德區', '龍潭區', '平鎮區',
            '新屋區', '觀音區', '復興區'
        ];

        return $this->state(fn (array $attributes) => [
            'address' => sprintf(
                '桃園市%s%s%d號',
                $this->faker->randomElement($districts),
                $this->faker->streetName(),
                $this->faker->numberBetween(1, 999)
            ),
        ]);
    }
} 