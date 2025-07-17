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
        // 中文商品名稱池
        $productNames = [
            '辦公椅', '電腦桌', '文件櫃', '書架', '辦公桌',
            '會議桌', '白板', '投影機', '印表機', '掃描器',
            '筆記型電腦', '顯示器', '鍵盤', '滑鼠', '耳機',
            '辦公椅墊', '檯燈', '文具組', '計算機', '碎紙機'
        ];
        
        $adjectives = ['高級', '標準', '經濟', '專業', '多功能'];
        
        return [
            'name' => fake()->randomElement($adjectives) . fake()->randomElement($productNames),
            'description' => fake()->optional(0.8)->randomElement([
                '優質材料製造，經久耐用',
                '符合人體工學設計，舒適實用',
                '現代簡約風格，適合各種辦公環境',
                '高品質產品，提供完善售後服務',
                '專業級設備，提升工作效率'
            ]),
            'category_id' => null, // 預設無分類
        ];
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
