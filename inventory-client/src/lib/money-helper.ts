/**
 * 前端金額計算工具類
 * 與後端保持一致的計算邏輯
 * 注意：前端只處理元，不需要分/元轉換（後端 Model 層會自動處理）
 */
export class MoneyHelper {

  /**
   * 從未稅價計算含稅價（台灣營業稅 5%）
   */
  static calculatePriceWithTax(priceWithoutTax: number, taxRate: number = 5): number {
    return Math.round(priceWithoutTax * (1 + taxRate / 100) * 100) / 100;
  }

  /**
   * 從含稅價計算未稅價（台灣營業稅 5%）
   */
  static calculatePriceWithoutTax(priceWithTax: number, taxRate: number = 5): number {
    return Math.round(priceWithTax / (1 + taxRate / 100) * 100) / 100;
  }

  /**
   * 從含稅價計算稅額
   */
  static calculateTaxFromPriceWithTax(priceWithTax: number, taxRate: number = 5): number {
    if (taxRate <= 0) {
      return 0;
    }
    const priceWithoutTax = this.calculatePriceWithoutTax(priceWithTax, taxRate);
    return Math.round((priceWithTax - priceWithoutTax) * 100) / 100;
  }

  /**
   * 從未稅價計算稅額
   */
  static calculateTaxFromPriceWithoutTax(priceWithoutTax: number, taxRate: number = 5): number {
    if (taxRate <= 0) {
      return 0;
    }
    return Math.round(priceWithoutTax * (taxRate / 100) * 100) / 100;
  }

  /**
   * 格式化金額顯示
   */
  static format(amount: number | null | undefined, currency: string = 'NT$', showDecimals: boolean = false): string {
    // 處理 null/undefined 值
    if (amount == null) {
      return `${currency} 0`;
    }

    // 使用 toLocaleString() 統一格式化
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    };

    return `${currency} ${amount.toLocaleString('zh-TW', options)}`;
  }

  /**
   * 確保金額精度為兩位小數
   */
  static ensurePrecision(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}