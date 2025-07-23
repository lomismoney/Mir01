<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Attribute;
use App\Models\AttributeValue;

class AttributeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 建立顏色屬性
        $this->createColorAttributes();
        
        // 建立尺寸屬性
        $this->createSizeAttributes();
        
        // 建立容量屬性
        $this->createCapacityAttributes();
        
        // 建立材質屬性
        $this->createMaterialAttributes();
        
        // 建立規格屬性
        $this->createSpecificationAttributes();
        
        echo "屬性資料建立完成！\n";
        echo "總計：" . Attribute::count() . " 個屬性，" . AttributeValue::count() . " 個屬性值\n";
    }
    
    /**
     * 建立顏色屬性
     */
    private function createColorAttributes(): void
    {
        $color = Attribute::firstOrCreate(
            ['name' => '顏色']
        );
        
        $colors = [
            // 基本色系
            '黑色' => ['hex' => '#000000', 'description' => '經典黑色'],
            '白色' => ['hex' => '#FFFFFF', 'description' => '純淨白色'],
            '灰色' => ['hex' => '#808080', 'description' => '中性灰色'],
            '銀色' => ['hex' => '#C0C0C0', 'description' => '金屬銀色'],
            '金色' => ['hex' => '#FFD700', 'description' => '奢華金色'],
            
            // 紅色系
            '紅色' => ['hex' => '#FF0000', 'description' => '正紅色'],
            '深紅色' => ['hex' => '#8B0000', 'description' => '酒紅色'],
            '粉紅色' => ['hex' => '#FFC0CB', 'description' => '淺粉紅色'],
            '玫瑰金' => ['hex' => '#B76E79', 'description' => '玫瑰金色'],
            
            // 藍色系
            '藍色' => ['hex' => '#0000FF', 'description' => '正藍色'],
            '深藍色' => ['hex' => '#000080', 'description' => '海軍藍'],
            '淺藍色' => ['hex' => '#ADD8E6', 'description' => '天空藍'],
            '寶藍色' => ['hex' => '#4169E1', 'description' => '皇家藍'],
            
            // 綠色系
            '綠色' => ['hex' => '#008000', 'description' => '正綠色'],
            '深綠色' => ['hex' => '#006400', 'description' => '森林綠'],
            '淺綠色' => ['hex' => '#90EE90', 'description' => '薄荷綠'],
            '橄欖綠' => ['hex' => '#808000', 'description' => '軍綠色'],
            
            // 黃色系
            '黃色' => ['hex' => '#FFFF00', 'description' => '明黃色'],
            '橙色' => ['hex' => '#FFA500', 'description' => '橘色'],
            '米色' => ['hex' => '#F5DEB3', 'description' => '米黃色'],
            
            // 紫色系
            '紫色' => ['hex' => '#800080', 'description' => '正紫色'],
            '深紫色' => ['hex' => '#4B0082', 'description' => '靛紫色'],
            '淺紫色' => ['hex' => '#E6E6FA', 'description' => '薰衣草紫'],
            
            // 棕色系
            '棕色' => ['hex' => '#A52A2A', 'description' => '咖啡色'],
            '深棕色' => ['hex' => '#654321', 'description' => '深咖啡色'],
            '淺棕色' => ['hex' => '#D2691E', 'description' => '駝色'],
            
            // 特殊色
            '透明' => ['hex' => null, 'description' => '透明無色'],
            '彩虹色' => ['hex' => null, 'description' => '多彩漸變'],
            '迷彩' => ['hex' => null, 'description' => '迷彩圖案'],
        ];
        
        foreach ($colors as $colorName => $colorData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $color->id,
                    'value' => $colorName
                ]
            );
        }
        
        echo "建立了顏色屬性，包含 " . count($colors) . " 種顏色\n";
    }
    
    /**
     * 建立尺寸屬性
     */
    private function createSizeAttributes(): void
    {
        // 衣服尺寸（國際標準）
        $clothingSize = Attribute::firstOrCreate(
            ['name' => '尺寸']
        );
        
        $clothingSizes = [
            'XXS' => ['eu' => '32', 'us' => '0', 'uk' => '4', 'description' => '超小號'],
            'XS' => ['eu' => '34', 'us' => '2', 'uk' => '6', 'description' => '加小號'],
            'S' => ['eu' => '36', 'us' => '4', 'uk' => '8', 'description' => '小號'],
            'M' => ['eu' => '38', 'us' => '6', 'uk' => '10', 'description' => '中號'],
            'L' => ['eu' => '40', 'us' => '8', 'uk' => '12', 'description' => '大號'],
            'XL' => ['eu' => '42', 'us' => '10', 'uk' => '14', 'description' => '加大號'],
            'XXL' => ['eu' => '44', 'us' => '12', 'uk' => '16', 'description' => '超大號'],
            'XXXL' => ['eu' => '46', 'us' => '14', 'uk' => '18', 'description' => '特大號'],
        ];
        
        foreach ($clothingSizes as $sizeName => $sizeData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $clothingSize->id,
                    'value' => $sizeName
                ]
            );
        }
        
        // 鞋子尺寸（歐洲尺碼）
        $shoeSize = Attribute::firstOrCreate(
            ['name' => '鞋碼']
        );
        
        $shoeSizes = [
            '35' => ['us_women' => '5', 'us_men' => '3.5', 'uk' => '2.5', 'cm' => '22.5'],
            '36' => ['us_women' => '6', 'us_men' => '4.5', 'uk' => '3.5', 'cm' => '23'],
            '37' => ['us_women' => '6.5', 'us_men' => '5', 'uk' => '4', 'cm' => '23.5'],
            '38' => ['us_women' => '7.5', 'us_men' => '6', 'uk' => '5', 'cm' => '24'],
            '39' => ['us_women' => '8.5', 'us_men' => '6.5', 'uk' => '5.5', 'cm' => '24.5'],
            '40' => ['us_women' => '9', 'us_men' => '7', 'uk' => '6', 'cm' => '25'],
            '41' => ['us_women' => '9.5', 'us_men' => '8', 'uk' => '7', 'cm' => '26'],
            '42' => ['us_women' => '10.5', 'us_men' => '8.5', 'uk' => '7.5', 'cm' => '26.5'],
            '43' => ['us_women' => '11', 'us_men' => '9.5', 'uk' => '8.5', 'cm' => '27'],
            '44' => ['us_women' => '12', 'us_men' => '10', 'uk' => '9', 'cm' => '27.5'],
            '45' => ['us_women' => '12.5', 'us_men' => '11', 'uk' => '10', 'cm' => '28.5'],
            '46' => ['us_women' => '13', 'us_men' => '11.5', 'uk' => '10.5', 'cm' => '29'],
        ];
        
        foreach ($shoeSizes as $sizeName => $sizeData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $shoeSize->id,
                    'value' => $sizeName
                ]
            );
        }
        
        // 褲子腰圍尺寸
        $waistSize = Attribute::firstOrCreate(
            ['name' => '腰圍']
        );
        
        $waistSizes = [
            '26' => ['cm' => '66', 'inch' => '26', 'size' => 'XXS'],
            '27' => ['cm' => '68.5', 'inch' => '27', 'size' => 'XS'],
            '28' => ['cm' => '71', 'inch' => '28', 'size' => 'XS'],
            '29' => ['cm' => '73.5', 'inch' => '29', 'size' => 'S'],
            '30' => ['cm' => '76', 'inch' => '30', 'size' => 'S'],
            '31' => ['cm' => '78.5', 'inch' => '31', 'size' => 'M'],
            '32' => ['cm' => '81', 'inch' => '32', 'size' => 'M'],
            '33' => ['cm' => '83.5', 'inch' => '33', 'size' => 'L'],
            '34' => ['cm' => '86', 'inch' => '34', 'size' => 'L'],
            '35' => ['cm' => '88.5', 'inch' => '35', 'size' => 'XL'],
            '36' => ['cm' => '91', 'inch' => '36', 'size' => 'XL'],
            '38' => ['cm' => '96', 'inch' => '38', 'size' => 'XXL'],
            '40' => ['cm' => '101', 'inch' => '40', 'size' => 'XXXL'],
        ];
        
        foreach ($waistSizes as $sizeName => $sizeData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $waistSize->id,
                    'value' => $sizeName
                ]
            );
        }
        
        echo "建立了尺寸相關屬性：衣服尺寸、鞋碼、腰圍\n";
    }
    
    /**
     * 建立容量屬性
     */
    private function createCapacityAttributes(): void
    {
        // 儲存容量（電子產品）
        $storageCapacity = Attribute::firstOrCreate(
            ['name' => '容量']
        );
        
        $storageCapacities = [
            '16GB' => ['bytes' => '16000000000', 'type' => 'storage'],
            '32GB' => ['bytes' => '32000000000', 'type' => 'storage'],
            '64GB' => ['bytes' => '64000000000', 'type' => 'storage'],
            '128GB' => ['bytes' => '128000000000', 'type' => 'storage'],
            '256GB' => ['bytes' => '256000000000', 'type' => 'storage'],
            '512GB' => ['bytes' => '512000000000', 'type' => 'storage'],
            '1TB' => ['bytes' => '1000000000000', 'type' => 'storage'],
            '2TB' => ['bytes' => '2000000000000', 'type' => 'storage'],
            '4TB' => ['bytes' => '4000000000000', 'type' => 'storage'],
        ];
        
        foreach ($storageCapacities as $capacityName => $capacityData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $storageCapacity->id,
                    'value' => $capacityName
                ]
            );
        }
        
        // 液體容量
        $liquidCapacity = Attribute::firstOrCreate(
            ['name' => '容量(ml)']
        );
        
        $liquidCapacities = [
            '50ml' => ['ml' => 50, 'oz' => '1.7'],
            '100ml' => ['ml' => 100, 'oz' => '3.4'],
            '150ml' => ['ml' => 150, 'oz' => '5.1'],
            '200ml' => ['ml' => 200, 'oz' => '6.8'],
            '250ml' => ['ml' => 250, 'oz' => '8.5'],
            '350ml' => ['ml' => 350, 'oz' => '11.8'],
            '500ml' => ['ml' => 500, 'oz' => '16.9'],
            '750ml' => ['ml' => 750, 'oz' => '25.4'],
            '1L' => ['ml' => 1000, 'oz' => '33.8'],
            '1.5L' => ['ml' => 1500, 'oz' => '50.7'],
            '2L' => ['ml' => 2000, 'oz' => '67.6'],
        ];
        
        foreach ($liquidCapacities as $capacityName => $capacityData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $liquidCapacity->id,
                    'value' => $capacityName
                ]
            );
        }
        
        // 記憶體容量
        $memoryCapacity = Attribute::firstOrCreate(
            ['name' => '記憶體']
        );
        
        $memoryCapacities = [
            '4GB' => ['type' => 'RAM', 'speed' => 'DDR4'],
            '8GB' => ['type' => 'RAM', 'speed' => 'DDR4'],
            '16GB' => ['type' => 'RAM', 'speed' => 'DDR4'],
            '32GB' => ['type' => 'RAM', 'speed' => 'DDR5'],
            '64GB' => ['type' => 'RAM', 'speed' => 'DDR5'],
        ];
        
        foreach ($memoryCapacities as $capacityName => $capacityData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $memoryCapacity->id,
                    'value' => $capacityName
                ]
            );
        }
        
        echo "建立了容量相關屬性：儲存容量、液體容量、記憶體容量\n";
    }
    
    /**
     * 建立材質屬性
     */
    private function createMaterialAttributes(): void
    {
        $material = Attribute::firstOrCreate(
            ['name' => '材質']
        );
        
        $materials = [
            // 纖維材質
            '純棉' => ['type' => 'natural', 'description' => '100%純棉，透氣舒適'],
            '棉' => ['type' => 'natural', 'description' => '棉質混紡'],
            '亞麻' => ['type' => 'natural', 'description' => '天然亞麻纖維'],
            '羊毛' => ['type' => 'natural', 'description' => '保暖羊毛材質'],
            '絲綢' => ['type' => 'natural', 'description' => '光滑絲綢材質'],
            
            // 合成纖維
            '聚酯纖維' => ['type' => 'synthetic', 'description' => '耐用聚酯纖維'],
            '尼龍' => ['type' => 'synthetic', 'description' => '彈性尼龍材質'],
            '壓克力' => ['type' => 'synthetic', 'description' => '仿羊毛壓克力'],
            '萊卡' => ['type' => 'synthetic', 'description' => '彈性萊卡纖維'],
            
            // 皮革材質
            '真皮' => ['type' => 'leather', 'description' => '天然真皮'],
            '牛皮' => ['type' => 'leather', 'description' => '優質牛皮'],
            '羊皮' => ['type' => 'leather', 'description' => '柔軟羊皮'],
            '人造皮革' => ['type' => 'synthetic', 'description' => 'PU人造皮革'],
            '皮革' => ['type' => 'leather', 'description' => '皮革材質'],
            
            // 金屬材質
            '不鏽鋼' => ['type' => 'metal', 'description' => '304不鏽鋼'],
            '鋁合金' => ['type' => 'metal', 'description' => '輕量鋁合金'],
            '鈦合金' => ['type' => 'metal', 'description' => '高強度鈦合金'],
            '黃銅' => ['type' => 'metal', 'description' => '黃銅材質'],
            
            // 塑膠材質
            '塑膠' => ['type' => 'plastic', 'description' => '一般塑膠'],
            'ABS塑膠' => ['type' => 'plastic', 'description' => '耐衝擊ABS'],
            'PC塑膠' => ['type' => 'plastic', 'description' => '透明PC塑膠'],
            '矽膠' => ['type' => 'plastic', 'description' => '食品級矽膠'],
            'TPU' => ['type' => 'plastic', 'description' => '軟性TPU材質'],
            
            // 其他材質
            '木質' => ['type' => 'wood', 'description' => '天然木材'],
            '竹子' => ['type' => 'wood', 'description' => '環保竹材'],
            '玻璃' => ['type' => 'glass', 'description' => '強化玻璃'],
            '陶瓷' => ['type' => 'ceramic', 'description' => '陶瓷材質'],
            '網布' => ['type' => 'fabric', 'description' => '透氣網布'],
            '碳纖維' => ['type' => 'composite', 'description' => '輕量碳纖維'],
        ];
        
        foreach ($materials as $materialName => $materialData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $material->id,
                    'value' => $materialName
                ]
            );
        }
        
        echo "建立了材質屬性，包含 " . count($materials) . " 種材質\n";
    }
    
    /**
     * 建立規格屬性
     */
    private function createSpecificationAttributes(): void
    {
        // 電壓規格
        $voltage = Attribute::firstOrCreate(
            ['name' => '電壓']
        );
        
        $voltages = [
            '110V' => ['type' => 'AC', 'frequency' => '60Hz', 'region' => '台灣/美國'],
            '220V' => ['type' => 'AC', 'frequency' => '50Hz', 'region' => '歐洲/中國'],
            '100-240V' => ['type' => 'AC', 'frequency' => '50-60Hz', 'region' => '全球通用'],
            '5V' => ['type' => 'DC', 'usage' => 'USB供電'],
            '12V' => ['type' => 'DC', 'usage' => '車用/LED'],
            '24V' => ['type' => 'DC', 'usage' => '工業用'],
        ];
        
        foreach ($voltages as $voltageName => $voltageData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $voltage->id,
                    'value' => $voltageName
                ]
            );
        }
        
        // 功率規格
        $power = Attribute::firstOrCreate(
            ['name' => '功率']
        );
        
        $powers = [
            '5W' => ['type' => 'low', 'usage' => 'LED燈/充電器'],
            '10W' => ['type' => 'low', 'usage' => '無線充電'],
            '20W' => ['type' => 'medium', 'usage' => '快充'],
            '45W' => ['type' => 'medium', 'usage' => '筆電充電'],
            '65W' => ['type' => 'medium', 'usage' => '筆電快充'],
            '100W' => ['type' => 'high', 'usage' => '高功率設備'],
            '500W' => ['type' => 'high', 'usage' => '家電'],
            '1000W' => ['type' => 'high', 'usage' => '大型家電'],
            '1500W' => ['type' => 'high', 'usage' => '電暖器/吹風機'],
        ];
        
        foreach ($powers as $powerName => $powerData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $power->id,
                    'value' => $powerName
                ]
            );
        }
        
        // 重量規格
        $weight = Attribute::firstOrCreate(
            ['name' => '重量']
        );
        
        $weights = [
            '50g' => ['gram' => 50, 'oz' => '1.76'],
            '100g' => ['gram' => 100, 'oz' => '3.53'],
            '200g' => ['gram' => 200, 'oz' => '7.05'],
            '500g' => ['gram' => 500, 'oz' => '17.64'],
            '1kg' => ['gram' => 1000, 'oz' => '35.27'],
            '2kg' => ['gram' => 2000, 'oz' => '70.55'],
            '5kg' => ['gram' => 5000, 'oz' => '176.37'],
            '10kg' => ['gram' => 10000, 'oz' => '352.74'],
        ];
        
        foreach ($weights as $weightName => $weightData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $weight->id,
                    'value' => $weightName
                ]
            );
        }
        
        // 螢幕尺寸
        $screenSize = Attribute::firstOrCreate(
            ['name' => '螢幕尺寸']
        );
        
        $screenSizes = [
            '5.5吋' => ['diagonal_cm' => '13.97', 'type' => 'phone'],
            '6.1吋' => ['diagonal_cm' => '15.49', 'type' => 'phone'],
            '6.7吋' => ['diagonal_cm' => '17.02', 'type' => 'phone'],
            '11吋' => ['diagonal_cm' => '27.94', 'type' => 'tablet'],
            '12.9吋' => ['diagonal_cm' => '32.77', 'type' => 'tablet'],
            '13.3吋' => ['diagonal_cm' => '33.78', 'type' => 'laptop'],
            '14吋' => ['diagonal_cm' => '35.56', 'type' => 'laptop'],
            '15.6吋' => ['diagonal_cm' => '39.62', 'type' => 'laptop'],
            '16吋' => ['diagonal_cm' => '40.64', 'type' => 'laptop'],
            '24吋' => ['diagonal_cm' => '60.96', 'type' => 'monitor'],
            '27吋' => ['diagonal_cm' => '68.58', 'type' => 'monitor'],
            '32吋' => ['diagonal_cm' => '81.28', 'type' => 'monitor'],
        ];
        
        foreach ($screenSizes as $sizeName => $sizeData) {
            AttributeValue::firstOrCreate(
                [
                    'attribute_id' => $screenSize->id,
                    'value' => $sizeName
                ]
            );
        }
        
        echo "建立了規格相關屬性：電壓、功率、重量、螢幕尺寸\n";
    }
}