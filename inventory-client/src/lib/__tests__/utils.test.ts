/**
 * @jest-environment jsdom
 */
import { cn, formatDate, addImageCacheBuster, getOrderStatusText, getOrderStatusVariant } from '../utils';

/**
 * Utils 模組測試套件
 * 
 * 測試覆蓋範圍：
 * 1. cn 函數（class name 合併）
 * 2. formatDate 函數（日期格式化）
 * 3. addImageCacheBuster 函數（圖片緩存破壞）
 * 4. getOrderStatusText 函數（訂單狀態翻譯）
 * 5. getOrderStatusVariant 函數（訂單狀態樣式）
 */
describe('Utils', () => {
  
  /**
   * cn 函數測試
   */
  describe('cn', () => {
    it('應該正確合併類名', () => {
      expect(cn('px-2 py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500');
    });

    it('應該處理條件類名', () => {
      expect(cn('base-class', true && 'conditional-class', false && 'hidden-class'))
        .toBe('base-class conditional-class');
    });

    it('應該解決 Tailwind 衝突', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('應該處理空值', () => {
      expect(cn()).toBe('');
      expect(cn('', null, undefined)).toBe('');
    });

    it('應該處理陣列', () => {
      expect(cn(['px-2', 'py-1'], 'bg-red-500')).toBe('px-2 py-1 bg-red-500');
    });
  });

  /**
   * formatDate 函數測試
   */
  describe('formatDate', () => {
    it('應該格式化有效的 Date 物件', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatDate(date);
      expect(result).toContain('2023');
      expect(result).toContain('12');
      expect(result).toContain('25');
    });

    it('應該格式化有效的日期字串', () => {
      const result = formatDate('2023-12-25T10:30:00Z');
      expect(result).toContain('2023');
      expect(result).toContain('12');
      expect(result).toContain('25');
    });

    it('應該處理 null 值', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    it('應該處理 undefined 值', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('應該處理空字串', () => {
      expect(formatDate('')).toBe('N/A');
    });

    it('應該處理無效的日期字串', () => {
      expect(formatDate('invalid-date')).toBe('N/A');
    });

    it('應該接受自定義格式選項', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatDate(date, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      expect(result).toContain('2023');
      expect(result).toContain('12'); // 月份
      expect(result).toContain('25'); // 日期
    });
  });

  /**
   * addImageCacheBuster 函數測試
   */
  describe('addImageCacheBuster', () => {
    beforeEach(() => {
      // 模擬固定的時間戳
      jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('應該為沒有查詢參數的 URL 添加時間戳', () => {
      const result = addImageCacheBuster('https://example.com/image.jpg');
      expect(result).toBe('https://example.com/image.jpg?t=1640995200000');
    });

    it('應該為已有查詢參數的 URL 添加時間戳', () => {
      const result = addImageCacheBuster('https://example.com/image.jpg?size=large');
      expect(result).toBe('https://example.com/image.jpg?size=large&t=1640995200000');
    });

    it('應該使用提供的字串時間戳', () => {
      const result = addImageCacheBuster('https://example.com/image.jpg', '2023-01-01T00:00:00Z');
      expect(result).toBe('https://example.com/image.jpg?t=1672531200000');
    });

    it('應該使用提供的數字時間戳', () => {
      const result = addImageCacheBuster('https://example.com/image.jpg', 1234567890);
      expect(result).toBe('https://example.com/image.jpg?t=1234567890');
    });

    it('應該使用提供的 Date 物件時間戳', () => {
      const date = new Date('2023-06-15T12:00:00Z');
      const result = addImageCacheBuster('https://example.com/image.jpg', date);
      expect(result).toBe('https://example.com/image.jpg?t=1686830400000');
    });

    it('應該處理 null 或 undefined 的 URL', () => {
      expect(addImageCacheBuster(null)).toBeNull();
      expect(addImageCacheBuster(undefined)).toBeNull();
    });

    it('應該處理空字串 URL', () => {
      expect(addImageCacheBuster('')).toBeNull();
    });
  });

  /**
   * getOrderStatusText 函數測試
   */
  describe('getOrderStatusText', () => {
    it('應該翻譯付款狀態', () => {
      expect(getOrderStatusText('pending')).toBe('待付款');
      expect(getOrderStatusText('paid')).toBe('已付款');
      expect(getOrderStatusText('partial')).toBe('部分付款');
      expect(getOrderStatusText('refunded')).toBe('已退款');
    });

    it('應該翻譯出貨狀態', () => {
      expect(getOrderStatusText('processing')).toBe('處理中');
      expect(getOrderStatusText('shipped')).toBe('已出貨');
      expect(getOrderStatusText('delivered')).toBe('已送達');
      expect(getOrderStatusText('cancelled')).toBe('已取消');
      expect(getOrderStatusText('completed')).toBe('已完成');
    });

    it('應該處理項目狀態', () => {
      expect(getOrderStatusText('待處理')).toBe('待處理');
      expect(getOrderStatusText('已叫貨')).toBe('已叫貨');
      expect(getOrderStatusText('已出貨')).toBe('已出貨');
      expect(getOrderStatusText('完成')).toBe('完成');
    });

    it('應該返回未知狀態的原始值', () => {
      expect(getOrderStatusText('unknown_status')).toBe('unknown_status');
      expect(getOrderStatusText('')).toBe('');
    });
  });

  /**
   * getOrderStatusVariant 函數測試
   */
  describe('getOrderStatusVariant', () => {
    it('應該為完成狀態返回 default variant', () => {
      expect(getOrderStatusVariant('completed')).toBe('default');
      expect(getOrderStatusVariant('paid')).toBe('default');
      expect(getOrderStatusVariant('shipped')).toBe('default');
      expect(getOrderStatusVariant('delivered')).toBe('default');
    });

    it('應該為取消狀態返回 destructive variant', () => {
      expect(getOrderStatusVariant('cancelled')).toBe('destructive');
      expect(getOrderStatusVariant('refunded')).toBe('destructive');
    });

    it('應該為處理中狀態返回 secondary variant', () => {
      expect(getOrderStatusVariant('processing')).toBe('secondary');
      expect(getOrderStatusVariant('partial')).toBe('secondary');
    });

    it('應該為待處理狀態返回 outline variant', () => {
      expect(getOrderStatusVariant('pending')).toBe('outline');
    });

    it('應該為未知狀態返回 outline variant', () => {
      expect(getOrderStatusVariant('unknown_status')).toBe('outline');
      expect(getOrderStatusVariant('')).toBe('outline');
    });
  });

});