<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'description' => fake()->optional(0.7)->sentence(),
            'parent_id' => null, // 預設為頂級分類
        ];
    }

    /**
     * 指定此分類為子分類
     *
     * @param int $parentId 父分類ID
     * @return static
     */
    public function asChild(int $parentId): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parentId,
        ]);
    }
} 