<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * 運行分類數據播種器
     */
    public function run(): void
    {
        // 建立頂層分類
        $categories = $this->createTopCategories();
        
        // 建立子分類
        $this->createSubCategories($categories);
        
        echo "建立了 " . Category::count() . " 個商品分類\n";
    }
    
    /**
     * 建立頂層分類
     */
    private function createTopCategories(): array
    {
        $topCategories = [
            [
                'name' => '電子產品',
                'description' => '各類電子產品和配件',
            ],
            [
                'name' => '服飾配件',
                'description' => '各類服裝和配件',
            ],
            [
                'name' => '辦公用品',
                'description' => '辦公室必備用品',
            ],
            [
                'name' => '家居生活',
                'description' => '生活用品和家居裝飾',
            ],
            [
                'name' => '運動休閒',
                'description' => '運動器材和休閒用品',
            ],
            [
                'name' => '美妝保養',
                'description' => '美妝產品和保養品',
            ],
            [
                'name' => '屁股',
                'description' => '屁股相關產品',
            ],
        ];
        
        $categories = [];
        foreach ($topCategories as $categoryData) {
            $categories[$categoryData['name']] = Category::firstOrCreate(
                ['name' => $categoryData['name']],
                $categoryData
            );
        }
        
        return $categories;
    }
    
    /**
     * 建立子分類
     */
    private function createSubCategories(array $topCategories): void
    {
        $subCategories = [
            '電子產品' => [
                ['name' => '手機', 'description' => '智慧型手機和配件'],
                ['name' => '筆記型電腦', 'description' => '各品牌筆電'],
                ['name' => '平板電腦', 'description' => '平板電腦和配件'],
                ['name' => '電腦配件', 'description' => '滑鼠、鍵盤、耳機等'],
                ['name' => '智慧穿戴', 'description' => '智慧手錶和手環'],
                ['name' => '音響設備', 'description' => '喇叭、耳機、音響'],
            ],
            '服飾配件' => [
                ['name' => '男裝', 'description' => '男性服飾'],
                ['name' => '女裝', 'description' => '女性服飾'],
                ['name' => '鞋子', 'description' => '各類鞋款'],
                ['name' => '包包', 'description' => '背包、手提包等'],
                ['name' => '飾品', 'description' => '項鍊、手錶、眼鏡等'],
                ['name' => '帽子', 'description' => '各式帽款'],
            ],
            '辦公用品' => [
                ['name' => '文具', 'description' => '筆類、筆記本等'],
                ['name' => '辦公傢俱', 'description' => '辦公桌椅、櫃子等'],
                ['name' => '辦公設備', 'description' => '印表機、碎紙機等'],
                ['name' => '收納用品', 'description' => '檔案夾、收納盒等'],
                ['name' => '會議用品', 'description' => '白板、投影設備等'],
            ],
            '家居生活' => [
                ['name' => '廚房用品', 'description' => '鍋具、餐具等'],
                ['name' => '寢具', 'description' => '床單、枕頭、被子等'],
                ['name' => '清潔用品', 'description' => '清潔劑、掃除工具等'],
                ['name' => '浴室用品', 'description' => '毛巾、浴簾等'],
                ['name' => '裝飾品', 'description' => '畫作、擺飾等'],
                ['name' => '收納傢俱', 'description' => '衣櫃、置物架等'],
            ],
            '運動休閒' => [
                ['name' => '健身器材', 'description' => '啞鈴、瑜珈墊等'],
                ['name' => '球類用品', 'description' => '籃球、足球、羽球等'],
                ['name' => '戶外用品', 'description' => '帳篷、睡袋等'],
                ['name' => '運動服飾', 'description' => '運動衣、運動鞋等'],
                ['name' => '自行車', 'description' => '自行車和配件'],
            ],
            '美妝保養' => [
                ['name' => '臉部保養', 'description' => '化妝水、乳液等'],
                ['name' => '彩妝', 'description' => '口紅、眼影等'],
                ['name' => '身體保養', 'description' => '身體乳、護手霜等'],
                ['name' => '頭髮護理', 'description' => '洗髮精、護髮素等'],
                ['name' => '香水', 'description' => '男性香水、女性香水等'],
            ],
        ];
        
        // 建立第二層分類
        foreach ($subCategories as $parentName => $children) {
            if (!isset($topCategories[$parentName])) {
                continue;
            }
            
            $parent = $topCategories[$parentName];
            
            foreach ($children as $childData) {
                $childData['parent_id'] = $parent->id;
                Category::firstOrCreate(
                    [
                        'name' => $childData['name'],
                        'parent_id' => $childData['parent_id']
                    ],
                    $childData
                );
            }
        }
        
        // 建立第三層分類範例（男裝的子分類）
        $menswear = Category::where('name', '男裝')->first();
        if ($menswear) {
            $menswearSubCategories = [
                ['name' => 'T恤', 'description' => '短袖T恤、長袖T恤'],
                ['name' => '襯衫', 'description' => '正式襯衫、休閒襯衫'],
                ['name' => '褲子', 'description' => '牛仔褲、西裝褲、短褲'],
                ['name' => '外套', 'description' => '夾克、風衣、大衣'],
                ['name' => '西裝', 'description' => '正式西裝套裝'],
            ];
            
            foreach ($menswearSubCategories as $subCategory) {
                $subCategory['parent_id'] = $menswear->id;
                Category::firstOrCreate(
                    [
                        'name' => $subCategory['name'],
                        'parent_id' => $subCategory['parent_id']
                    ],
                    $subCategory
                );
            }
        }
        
        // 建立第三層分類範例（手機的子分類）
        $phones = Category::where('name', '手機')->first();
        if ($phones) {
            $phoneSubCategories = [
                ['name' => 'iPhone', 'description' => 'Apple iPhone 系列'],
                ['name' => 'Android手機', 'description' => 'Android 系統手機'],
                ['name' => '手機配件', 'description' => '保護殼、充電器等'],
            ];
            
            foreach ($phoneSubCategories as $subCategory) {
                $subCategory['parent_id'] = $phones->id;
                Category::firstOrCreate(
                    [
                        'name' => $subCategory['name'],
                        'parent_id' => $subCategory['parent_id']
                    ],
                    $subCategory
                );
            }
        }
    }
}