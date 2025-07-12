<?php

namespace Tests\Unit\Enums;

use Tests\TestCase;
use App\Enums\OrderItemType;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;

class OrderItemTypeTest extends TestCase
{
    /**
     * 測試商品類型判斷邏輯
     */
    public function test_determine_type_returns_stock_for_stocked_items()
    {
        $itemData = [
            'product_variant_id' => 1,
            'is_stocked_sale' => true,
            'is_backorder' => false,
        ];
        
        $this->assertEquals(OrderItemType::STOCK, OrderItemType::determineType($itemData));
    }
    
    public function test_determine_type_returns_backorder_for_backorder_items()
    {
        $itemData = [
            'product_variant_id' => 1,
            'is_stocked_sale' => false,
            'is_backorder' => true,
        ];
        
        $this->assertEquals(OrderItemType::BACKORDER, OrderItemType::determineType($itemData));
    }
    
    public function test_determine_type_returns_custom_for_custom_items()
    {
        // 有變體ID但不是現貨也不是預訂
        $itemData = [
            'product_variant_id' => 1,
            'is_stocked_sale' => false,
            'is_backorder' => false,
        ];
        
        $this->assertEquals(OrderItemType::CUSTOM, OrderItemType::determineType($itemData));
    }
    
    public function test_determine_type_defaults_to_backorder_when_no_flags()
    {
        $itemData = [
            'product_variant_id' => 1,
        ];
        
        $this->assertEquals(OrderItemType::BACKORDER, OrderItemType::determineType($itemData));
    }
    
    /**
     * 測試庫存扣減判斷
     */
    public function test_should_deduct_inventory_only_for_stock_items()
    {
        $this->assertTrue(OrderItemType::shouldDeductInventory(OrderItemType::STOCK));
        $this->assertFalse(OrderItemType::shouldDeductInventory(OrderItemType::BACKORDER));
        $this->assertFalse(OrderItemType::shouldDeductInventory(OrderItemType::CUSTOM));
    }
    
    /**
     * 測試創建時履行狀態判斷
     */
    public function test_should_mark_fulfilled_on_create_only_for_stock_items()
    {
        $this->assertTrue(OrderItemType::shouldMarkFulfilledOnCreate(OrderItemType::STOCK));
        $this->assertFalse(OrderItemType::shouldMarkFulfilledOnCreate(OrderItemType::BACKORDER));
        $this->assertFalse(OrderItemType::shouldMarkFulfilledOnCreate(OrderItemType::CUSTOM));
    }
    
    /**
     * 測試選項列表
     */
    public function test_get_options_returns_all_types()
    {
        $options = OrderItemType::getOptions();
        
        $this->assertArrayHasKey(OrderItemType::STOCK, $options);
        $this->assertArrayHasKey(OrderItemType::BACKORDER, $options);
        $this->assertArrayHasKey(OrderItemType::CUSTOM, $options);
        
        $this->assertEquals('現貨商品', $options[OrderItemType::STOCK]);
        $this->assertEquals('預訂商品', $options[OrderItemType::BACKORDER]);
        $this->assertEquals('訂製商品', $options[OrderItemType::CUSTOM]);
    }

    /**
     * 測試邊界情況 - 沒有 product_variant_id
     */
    #[Test]
    public function it_returns_custom_when_no_product_variant_id()
    {
        $itemData = [
            'product_variant_id' => null,
            'is_stocked_sale' => true, // 即使標記為現貨，沒有 variant_id 也是訂製
            'is_backorder' => false,
        ];
        
        // 修正後的邏輯：沒有 variant_id 一定是訂製商品
        $this->assertEquals(OrderItemType::CUSTOM, OrderItemType::determineType($itemData));
    }

    /**
     * 測試邊界情況 - 空字串 product_variant_id
     */
    #[Test]
    public function it_returns_custom_when_empty_product_variant_id()
    {
        $itemData = [
            'product_variant_id' => '',
            'is_stocked_sale' => false,
            'is_backorder' => true,
        ];
        
        // 修正後的邏輯：空字串也視為沒有 variant_id，返回訂製商品
        $this->assertEquals(OrderItemType::CUSTOM, OrderItemType::determineType($itemData));
    }

    /**
     * 測試邊界情況 - 字串型態的布林值
     */
    #[Test]
    #[DataProvider('stringBooleanProvider')]
    public function it_handles_string_boolean_values($isStockedSale, $isBackorder, $expectedType)
    {
        $itemData = [
            'product_variant_id' => 123,
            'is_stocked_sale' => $isStockedSale,
            'is_backorder' => $isBackorder,
        ];
        
        $this->assertEquals($expectedType, OrderItemType::determineType($itemData));
    }

    public static function stringBooleanProvider(): array
    {
        return [
            'string "1" as stock' => ['1', '0', OrderItemType::STOCK],
            'string "1" as backorder' => ['0', '1', OrderItemType::BACKORDER],
            'numeric 1 as stock' => [1, 0, OrderItemType::STOCK],
            'numeric 1 as backorder' => [0, 1, OrderItemType::BACKORDER],
            'string "true" as stock' => ['true', 'false', OrderItemType::STOCK], // 注意：'true' 字串被視為 truthy
            'string "false" treated as truthy' => ['false', 'false', OrderItemType::STOCK], // 'false' 字串也是 truthy！
        ];
    }

    /**
     * 測試優先順序 - is_stocked_sale 優先於 is_backorder
     */
    #[Test]
    public function it_prioritizes_stock_over_backorder()
    {
        $itemData = [
            'product_variant_id' => 123,
            'is_stocked_sale' => true,
            'is_backorder' => true, // 兩個都是 true，應該優先判定為現貨
        ];
        
        $this->assertEquals(OrderItemType::STOCK, OrderItemType::determineType($itemData));
    }

    /**
     * 測試完全空的數據
     */
    #[Test]
    public function it_handles_empty_array()
    {
        $itemData = [];
        
        // 沒有 product_variant_id，應該返回 CUSTOM
        $this->assertEquals(OrderItemType::CUSTOM, OrderItemType::determineType($itemData));
    }

    /**
     * 測試 array_key_exists 的使用
     */
    #[Test]
    public function it_distinguishes_between_null_and_missing_keys()
    {
        // 明確設置為 null（相當於 false）
        $itemData1 = [
            'product_variant_id' => 123,
            'is_stocked_sale' => null,
            'is_backorder' => null,
        ];
        
        // 完全沒有這些鍵
        $itemData2 = [
            'product_variant_id' => 123,
        ];
        
        // 第一種情況：有鍵但值為 null，會被判定為訂製商品
        $this->assertEquals(OrderItemType::CUSTOM, OrderItemType::determineType($itemData1));
        
        // 第二種情況：沒有鍵，返回預設的預訂商品
        $this->assertEquals(OrderItemType::BACKORDER, OrderItemType::determineType($itemData2));
    }

    /**
     * 測試業務邏輯的合理性
     */
    #[Test]
    public function it_ensures_business_logic_consistency()
    {
        // 測試1：訂製商品不應該有 product_variant_id
        $customWithVariant = [
            'product_variant_id' => 123,
            'is_stocked_sale' => false,
            'is_backorder' => false,
            'custom_product_name' => 'Custom Product',
        ];
        $this->assertEquals(OrderItemType::CUSTOM, OrderItemType::determineType($customWithVariant));
        
        // 測試2：沒有 variant_id 的一定是訂製，無論其他標記如何
        $noVariantButMarkedAsStock = [
            'product_variant_id' => 0,
            'is_stocked_sale' => true,
            'is_backorder' => false,
        ];
        $this->assertEquals(OrderItemType::CUSTOM, OrderItemType::determineType($noVariantButMarkedAsStock));
        
        // 測試3：確保判斷的互斥性
        $conflictingFlags = [
            'product_variant_id' => 123,
            'is_stocked_sale' => true,
            'is_backorder' => true, // 同時標記為現貨和預訂
        ];
        // 應該優先判定為現貨
        $this->assertEquals(OrderItemType::STOCK, OrderItemType::determineType($conflictingFlags));
    }
}