import { MoneyHelper } from '../money-helper';

describe('MoneyHelper', () => {
  describe('calculatePriceWithTax', () => {
    it('should calculate price with tax correctly', () => {
      expect(MoneyHelper.calculatePriceWithTax(100, 5)).toBe(105);
      expect(MoneyHelper.calculatePriceWithTax(1000, 10)).toBe(1100);
      expect(MoneyHelper.calculatePriceWithTax(0, 5)).toBe(0);
    });

    it('should handle default tax rate', () => {
      expect(MoneyHelper.calculatePriceWithTax(100)).toBe(105);
    });
  });

  describe('calculatePriceWithoutTax', () => {
    it('should calculate price without tax correctly', () => {
      expect(MoneyHelper.calculatePriceWithoutTax(105, 5)).toBe(100);
      expect(MoneyHelper.calculatePriceWithoutTax(1100, 10)).toBe(1000);
      expect(MoneyHelper.calculatePriceWithoutTax(0, 5)).toBe(0);
    });

    it('should handle default tax rate', () => {
      expect(MoneyHelper.calculatePriceWithoutTax(105)).toBe(100);
    });
  });

  describe('calculateTaxFromPriceWithTax', () => {
    it('should extract tax from price inclusive of tax', () => {
      expect(MoneyHelper.calculateTaxFromPriceWithTax(105, 5)).toBe(5);
      expect(MoneyHelper.calculateTaxFromPriceWithTax(1100, 10)).toBe(100);
      expect(MoneyHelper.calculateTaxFromPriceWithTax(0, 5)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(MoneyHelper.calculateTaxFromPriceWithTax(100, 0)).toBe(0);
      expect(MoneyHelper.calculateTaxFromPriceWithTax(100, -5)).toBe(0);
    });
  });

  describe('calculateTaxFromPriceWithoutTax', () => {
    it('should calculate tax from price exclusive of tax', () => {
      expect(MoneyHelper.calculateTaxFromPriceWithoutTax(100, 5)).toBe(5);
      expect(MoneyHelper.calculateTaxFromPriceWithoutTax(1000, 10)).toBe(100);
      expect(MoneyHelper.calculateTaxFromPriceWithoutTax(0, 5)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(MoneyHelper.calculateTaxFromPriceWithoutTax(100, 0)).toBe(0);
      expect(MoneyHelper.calculateTaxFromPriceWithoutTax(100, -5)).toBe(0);
    });
  });

  describe('format', () => {
    it('should format amount without decimals by default', () => {
      expect(MoneyHelper.format(1000)).toBe('NT$ 1,000');
      expect(MoneyHelper.format(1234567)).toBe('NT$ 1,234,567');
      expect(MoneyHelper.format(0)).toBe('NT$ 0');
    });

    it('should format amount with decimals when specified', () => {
      expect(MoneyHelper.format(1000.5, 'NT$', true)).toBe('NT$ 1,000.50');
      expect(MoneyHelper.format(1234.567, 'NT$', true)).toBe('NT$ 1,234.57');
    });

    it('should handle custom currency', () => {
      expect(MoneyHelper.format(1000, '$')).toBe('$ 1,000');
      expect(MoneyHelper.format(1000, '¥')).toBe('¥ 1,000');
    });
  });

  describe('ensurePrecision', () => {
    it('should ensure two decimal precision', () => {
      expect(MoneyHelper.ensurePrecision(1.234)).toBe(1.23);
      expect(MoneyHelper.ensurePrecision(1.235)).toBe(1.24);
      expect(MoneyHelper.ensurePrecision(1.999)).toBe(2);
      expect(MoneyHelper.ensurePrecision(0.004)).toBe(0);
      expect(MoneyHelper.ensurePrecision(0.005)).toBe(0.01);
    });
  });

  describe('Taiwan tax calculation scenarios', () => {
    it('should handle Taiwan business tax correctly', () => {
      // 含稅價格 105 元，稅率 5%
      const tax = MoneyHelper.calculateTaxFromPriceWithTax(105, 5);
      expect(tax).toBe(5);

      // 未稅價格 100 元，稅率 5%
      const taxFromExclusive = MoneyHelper.calculateTaxFromPriceWithoutTax(100, 5);
      expect(taxFromExclusive).toBe(5);
    });

    it('should handle complex order scenarios', () => {
      // 訂單場景：商品 1000 + 運費 100 - 折扣 50 = 1050（含稅）
      const totalWithTax = 1050;
      const tax = MoneyHelper.calculateTaxFromPriceWithTax(totalWithTax, 5);
      expect(tax).toBe(50);

      // 驗證稅前金額
      const priceWithoutTax = totalWithTax - tax;
      expect(priceWithoutTax).toBe(1000);
    });

    it('should handle floating point precision in tax calculations', () => {
      // 複雜的小數計算
      const priceWithTax = 999.99;
      const tax = MoneyHelper.calculateTaxFromPriceWithTax(priceWithTax, 5);
      const priceWithoutTax = MoneyHelper.calculatePriceWithoutTax(priceWithTax, 5);
      
      // 驗證計算的一致性
      expect(priceWithoutTax + tax).toBeCloseTo(priceWithTax, 2);
    });
  });

  describe('edge cases and precision', () => {
    it('should handle floating point precision', () => {
      // 33.33 * 3 應該等於 99.99
      const prices = [33.33, 33.33, 33.33];
      const total = prices.reduce((sum, price) => sum + price, 0);
      expect(MoneyHelper.ensurePrecision(total)).toBe(99.99);
    });

    it('should handle very small amounts', () => {
      expect(MoneyHelper.calculateTaxFromPriceWithTax(0.05, 5)).toBe(0);
      expect(MoneyHelper.ensurePrecision(0.004)).toBe(0);
      expect(MoneyHelper.ensurePrecision(0.005)).toBe(0.01);
    });

    it('should handle very large amounts', () => {
      const largeAmount = 1000000;
      const tax = MoneyHelper.calculateTaxFromPriceWithoutTax(largeAmount, 5);
      expect(tax).toBe(50000);
    });

    it('should handle negative amounts', () => {
      expect(MoneyHelper.calculatePriceWithTax(-100, 5)).toBe(-105);
      expect(MoneyHelper.calculateTaxFromPriceWithoutTax(-100, 5)).toBe(-5);
    });
  });
});