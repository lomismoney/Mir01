<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3, false), // 生成 3 個詞的商品名稱
            'description' => fake()->optional(0.8)->paragraph(), // 80% 機率有描述
            'category_id' => null, // 預設無分類
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure()
    {
        return $this->afterCreating(function (\App\Models\Product $product) {
            // 創建分類
            $category = \App\Models\Category::factory()->create();
            $product->update(['category_id' => $category->id]);
            
            // 創建屬性
            $attributes = \App\Models\Attribute::factory()->count(2)->create();
            $product->attributes()->attach($attributes->pluck('id'));
            
            // 創建變體
            $variants = \App\Models\ProductVariant::factory()->count(3)->create([
                'product_id' => $product->id
            ]);
            
            // 為每個變體分配屬性值
            foreach ($variants as $variant) {
                foreach ($attributes as $attribute) {
                    $attributeValue = \App\Models\AttributeValue::factory()->create([
                        'attribute_id' => $attribute->id
                    ]);
                    $variant->attributeValues()->attach($attributeValue->id);
                }
            }
        });
    }

    /**
     * 生成有分類的商品狀態
     */
    public function withCategory($categoryId): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $categoryId,
        ]);
    }

    /**
     * 生成無描述的商品狀態
     */
    public function noDescription(): static
    {
        return $this->state(fn (array $attributes) => [
            'description' => null,
        ]);
    }
}
