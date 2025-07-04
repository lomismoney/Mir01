<?php

namespace Database\Factories;

use App\Models\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AttributeValue>
 */
class AttributeValueFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // 預設值，實際使用時通常會配合withAttribute方法
        return [
            'attribute_id' => Attribute::factory(),
            'value' => fake()->unique()->word(),
        ];
    }

    /**
     * 指定屬性值所屬的屬性
     *
     * @param int $attributeId 屬性ID
     * @return static
     */
    public function forAttribute(int $attributeId): static
    {
        return $this->state(fn (array $attributes) => [
            'attribute_id' => $attributeId,
        ]);
    }

    /**
     * 設定顏色屬性值
     *
     * @return static
     */
    public function asColor(): static
    {
        $colors = ['紅色', '藍色', '綠色', '黑色', '白色', '灰色', '黃色', '紫色'];
        
        return $this->state(fn (array $attributes) => [
            'value' => fake()->unique()->randomElement($colors),
        ]);
    }

    /**
     * 設定尺寸屬性值
     *
     * @return static
     */
    public function asSize(): static
    {
        $sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '1', '2', '3', '4'];
        
        return $this->state(fn (array $attributes) => [
            'value' => fake()->unique()->randomElement($sizes),
        ]);
    }
} 