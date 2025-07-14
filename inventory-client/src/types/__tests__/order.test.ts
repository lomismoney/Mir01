import {
  OrderItemType,
  ORDER_ITEM_TYPE_OPTIONS,
  determineOrderItemType,
  getOrderItemTypeFlags,
  shouldDeductInventory,
  shouldMarkFulfilledOnCreate,
  getFulfillmentBadgeVariant,
  getFulfillmentStatusText,
  getItemTypeBadgeVariant,
  type OrderItem,
  type FulfillmentStatus,
  type OrderItemFormData,
} from '../order';

describe('Order Types and Utilities', () => {
  describe('OrderItemType enum', () => {
    it('應該包含正確的訂單項目類型', () => {
      expect(OrderItemType.STOCK).toBe('stock');
      expect(OrderItemType.BACKORDER).toBe('backorder');
      expect(OrderItemType.CUSTOM).toBe('custom');
    });
  });

  describe('ORDER_ITEM_TYPE_OPTIONS', () => {
    it('應該包含正確的類型選項對應關係', () => {
      expect(ORDER_ITEM_TYPE_OPTIONS[OrderItemType.STOCK]).toBe('現貨商品');
      expect(ORDER_ITEM_TYPE_OPTIONS[OrderItemType.BACKORDER]).toBe('預訂商品');
      expect(ORDER_ITEM_TYPE_OPTIONS[OrderItemType.CUSTOM]).toBe('訂製商品');
    });

    it('應該覆蓋所有的 OrderItemType 值', () => {
      const enumValues = Object.values(OrderItemType);
      const optionKeys = Object.keys(ORDER_ITEM_TYPE_OPTIONS);
      
      expect(optionKeys).toHaveLength(enumValues.length);
      enumValues.forEach(value => {
        expect(optionKeys).toContain(value);
      });
    });
  });

  describe('determineOrderItemType', () => {
    it('應該正確判斷現貨商品', () => {
      const item = {
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        product_variant_id: 1,
      };
      expect(determineOrderItemType(item)).toBe(OrderItemType.STOCK);
    });

    it('應該正確判斷預訂商品', () => {
      const item = {
        is_stocked_sale: false,
        is_backorder: true,
        product_variant_id: 1,
      };
      expect(determineOrderItemType(item)).toBe(OrderItemType.BACKORDER);
    });

    it('應該正確判斷訂製商品', () => {
      const item = {
        is_stocked_sale: false,
        is_backorder: false,
        product_variant_id: 1,
      };
      expect(determineOrderItemType(item)).toBe(OrderItemType.CUSTOM);
    });

    it('應該在沒有變體ID時預設為預訂商品', () => {
      const item = {
        is_stocked_sale: false,
        is_backorder: false,
        product_variant_id: null,
      };
      expect(determineOrderItemType(item)).toBe(OrderItemType.BACKORDER);
    });

    it('應該在沒有任何標記時預設為預訂商品', () => {
      const item = {};
      expect(determineOrderItemType(item)).toBe(OrderItemType.BACKORDER);
    });

    it('應該優先處理現貨標記', () => {
      const item = {
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: true,
        product_variant_id: 1,
      };
      expect(determineOrderItemType(item)).toBe(OrderItemType.STOCK);
    });

    it('應該在有現貨標記時忽略其他條件', () => {
      const item = {
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        product_variant_id: null,
      };
      expect(determineOrderItemType(item)).toBe(OrderItemType.STOCK);
    });
  });

  describe('getOrderItemTypeFlags', () => {
    it('應該為現貨商品返回正確的標記', () => {
      const flags = getOrderItemTypeFlags(OrderItemType.STOCK);
      expect(flags).toEqual({
        is_stocked_sale: true,
        is_backorder: false,
      });
    });

    it('應該為預訂商品返回正確的標記', () => {
      const flags = getOrderItemTypeFlags(OrderItemType.BACKORDER);
      expect(flags).toEqual({
        is_stocked_sale: false,
        is_backorder: true,
      });
    });

    it('應該為訂製商品返回正確的標記', () => {
      const flags = getOrderItemTypeFlags(OrderItemType.CUSTOM);
      expect(flags).toEqual({
        is_stocked_sale: false,
        is_backorder: false,
      });
    });

    it('應該為無效類型返回預設標記', () => {
      const flags = getOrderItemTypeFlags('invalid' as OrderItemType);
      expect(flags).toEqual({
        is_stocked_sale: false,
        is_backorder: true,
      });
    });
  });

  describe('shouldDeductInventory', () => {
    it('應該為現貨商品返回 true', () => {
      expect(shouldDeductInventory(OrderItemType.STOCK)).toBe(true);
    });

    it('應該為預訂商品返回 false', () => {
      expect(shouldDeductInventory(OrderItemType.BACKORDER)).toBe(false);
    });

    it('應該為訂製商品返回 false', () => {
      expect(shouldDeductInventory(OrderItemType.CUSTOM)).toBe(false);
    });
  });

  describe('shouldMarkFulfilledOnCreate', () => {
    it('應該為現貨商品返回 true', () => {
      expect(shouldMarkFulfilledOnCreate(OrderItemType.STOCK)).toBe(true);
    });

    it('應該為預訂商品返回 false', () => {
      expect(shouldMarkFulfilledOnCreate(OrderItemType.BACKORDER)).toBe(false);
    });

    it('應該為訂製商品返回 false', () => {
      expect(shouldMarkFulfilledOnCreate(OrderItemType.CUSTOM)).toBe(false);
    });
  });

  describe('getFulfillmentBadgeVariant', () => {
    it('應該為已履行商品返回 default', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: 5,
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        is_fulfilled: true,
        fulfilled_at: '2024-01-15T10:00:00Z',
        purchase_item_id: null,
        purchase_status: 'fulfilled',
        purchase_status_text: '已履行',
      };
      
      expect(getFulfillmentBadgeVariant(item)).toBe('default');
    });

    it('應該為部分履行商品返回 secondary', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: 3,
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        is_fulfilled: false,
        fulfilled_at: null,
        purchase_item_id: null,
        purchase_status: 'partial',
        purchase_status_text: '部分履行',
      };
      
      expect(getFulfillmentBadgeVariant(item)).toBe('secondary');
    });

    it('應該為未履行商品返回 outline', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: 0,
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.BACKORDER,
        is_stocked_sale: false,
        is_backorder: true,
        is_fulfilled: false,
        fulfilled_at: null,
        purchase_item_id: null,
        purchase_status: 'pending',
        purchase_status_text: '待處理',
      };
      
      expect(getFulfillmentBadgeVariant(item)).toBe('outline');
    });
  });

  describe('getFulfillmentStatusText', () => {
    it('應該為已履行商品返回正確文字', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: 5,
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        is_fulfilled: true,
        fulfilled_at: '2024-01-15T10:00:00Z',
        purchase_item_id: null,
        purchase_status: 'fulfilled',
        purchase_status_text: '已履行',
      };
      
      expect(getFulfillmentStatusText(item)).toBe('已履行');
    });

    it('應該為部分履行商品返回正確文字', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: 3,
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        is_fulfilled: false,
        fulfilled_at: null,
        purchase_item_id: null,
        purchase_status: 'partial',
        purchase_status_text: '部分履行',
      };
      
      expect(getFulfillmentStatusText(item)).toBe('部分履行 (3/5)');
    });

    it('應該為未履行商品返回正確文字', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: 0,
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.BACKORDER,
        is_stocked_sale: false,
        is_backorder: true,
        is_fulfilled: false,
        fulfilled_at: null,
        purchase_item_id: null,
        purchase_status: 'pending',
        purchase_status_text: '待處理',
      };
      
      expect(getFulfillmentStatusText(item)).toBe('未履行');
    });
  });

  describe('getItemTypeBadgeVariant', () => {
    it('應該為現貨商品返回 default', () => {
      expect(getItemTypeBadgeVariant(OrderItemType.STOCK)).toBe('default');
    });

    it('應該為預訂商品返回 secondary', () => {
      expect(getItemTypeBadgeVariant(OrderItemType.BACKORDER)).toBe('secondary');
    });

    it('應該為訂製商品返回 outline', () => {
      expect(getItemTypeBadgeVariant(OrderItemType.CUSTOM)).toBe('outline');
    });

    it('應該為無效類型返回 outline', () => {
      expect(getItemTypeBadgeVariant('invalid' as OrderItemType)).toBe('outline');
    });
  });

  describe('Interface Types', () => {
    it('應該正確定義 FulfillmentStatus 介面', () => {
      const fulfillmentStatus: FulfillmentStatus = {
        is_fulfilled: true,
        fulfilled_quantity: 5,
        fulfilled_at: '2024-01-15T10:00:00Z',
        remaining_fulfillment_quantity: 0,
        is_partially_fulfilled: false,
        is_fully_fulfilled: true,
      };

      expect(fulfillmentStatus.is_fulfilled).toBe(true);
      expect(fulfillmentStatus.fulfilled_quantity).toBe(5);
      expect(fulfillmentStatus.fulfilled_at).toBe('2024-01-15T10:00:00Z');
      expect(fulfillmentStatus.remaining_fulfillment_quantity).toBe(0);
      expect(fulfillmentStatus.is_partially_fulfilled).toBe(false);
      expect(fulfillmentStatus.is_fully_fulfilled).toBe(true);
    });

    it('應該正確定義 OrderItemFormData 介面', () => {
      const formData: OrderItemFormData = {
        id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        tax_rate: 0.05,
        discount_amount: 10,
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        custom_product_name: undefined,
        custom_specifications: undefined,
      };

      expect(formData.id).toBe(1);
      expect(formData.product_variant_id).toBe(1);
      expect(formData.product_name).toBe('測試商品');
      expect(formData.sku).toBe('TEST-001');
      expect(formData.price).toBe(100);
      expect(formData.cost).toBe(50);
      expect(formData.quantity).toBe(5);
      expect(formData.tax_rate).toBe(0.05);
      expect(formData.discount_amount).toBe(10);
      expect(formData.item_type).toBe(OrderItemType.STOCK);
      expect(formData.is_stocked_sale).toBe(true);
      expect(formData.is_backorder).toBe(false);
    });

    it('應該支援訂製商品的 OrderItemFormData', () => {
      const customFormData: OrderItemFormData = {
        product_variant_id: null,
        product_name: '訂製商品',
        sku: 'CUSTOM-001',
        price: 200,
        quantity: 1,
        item_type: OrderItemType.CUSTOM,
        is_stocked_sale: false,
        is_backorder: false,
        custom_product_name: '客製化手機殼',
        custom_specifications: {
          color: '紅色',
          material: '矽膠',
          engraving: '客戶姓名',
        },
      };

      expect(customFormData.product_variant_id).toBeNull();
      expect(customFormData.custom_product_name).toBe('客製化手機殼');
      expect(customFormData.custom_specifications).toEqual({
        color: '紅色',
        material: '矽膠',
        engraving: '客戶姓名',
      });
    });
  });

  describe('Edge Cases', () => {
    it('應該處理部分履行數量等於總數量但未標記為已履行的情況', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: 5,
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        is_fulfilled: false, // 狀態不一致的情況
        fulfilled_at: null,
        purchase_item_id: null,
        purchase_status: 'fulfilled',
        purchase_status_text: '已履行',
      };
      
      expect(getFulfillmentBadgeVariant(item)).toBe('secondary');
      expect(getFulfillmentStatusText(item)).toBe('部分履行 (5/5)');
    });

    it('應該處理履行數量超過總數量的異常情況', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: 7, // 超過總數量
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        is_fulfilled: false,
        fulfilled_at: null,
        purchase_item_id: null,
        purchase_status: 'fulfilled',
        purchase_status_text: '已履行',
      };
      
      expect(getFulfillmentBadgeVariant(item)).toBe('secondary');
      expect(getFulfillmentStatusText(item)).toBe('部分履行 (7/5)');
    });

    it('應該處理負數履行數量的異常情況', () => {
      const item: OrderItem = {
        id: 1,
        order_id: 1,
        product_variant_id: 1,
        product_name: '測試商品',
        sku: 'TEST-001',
        price: 100,
        cost: 50,
        quantity: 5,
        fulfilled_quantity: -1, // 負數
        tax_rate: 0.05,
        discount_amount: 0,
        item_type: OrderItemType.STOCK,
        is_stocked_sale: true,
        is_backorder: false,
        is_fulfilled: false,
        fulfilled_at: null,
        purchase_item_id: null,
        purchase_status: 'pending',
        purchase_status_text: '待處理',
      };
      
      expect(getFulfillmentBadgeVariant(item)).toBe('outline');
      expect(getFulfillmentStatusText(item)).toBe('未履行');
    });
  });
});