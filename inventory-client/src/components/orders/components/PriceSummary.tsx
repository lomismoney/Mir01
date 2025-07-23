import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { OrderFormValues } from "../hooks/useOrderForm";
import { MoneyHelper } from "@/lib/money-helper";

interface PriceSummaryProps {
  form: UseFormReturn<OrderFormValues>;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
  isTaxInclusive: boolean;
  taxRate: number;
}

export function PriceSummary({
  form,
  subtotal,
  shippingFee,
  tax,
  discountAmount,
  grandTotal,
  isTaxInclusive,
  taxRate,
}: PriceSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>價格摘要</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 含稅/未稅切換 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="is_tax_inclusive"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3">
                <FormLabel className="text-base font-medium">
                  {field.value ? "含稅價格" : "未稅價格"}
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tax_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>稅率 (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="5"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shipping_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>運費</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discount_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>折扣金額</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 價格計算明細 */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>商品小計：</span>
            <span className="font-medium text-right w-[120px]">
              {MoneyHelper.format(subtotal, '$')}
            </span>
          </div>
          {shippingFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>運費：</span>
              <span className="font-medium text-right w-[120px]">
                {MoneyHelper.format(shippingFee, '$')}
              </span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>折扣：</span>
              <span className="font-medium text-right w-[120px]">
                -{MoneyHelper.format(discountAmount, '$')}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>
              {isTaxInclusive ? "內含稅金" : "稅金"} ({taxRate}%)：
            </span>
            <span className="font-medium text-right w-[120px]">
              {MoneyHelper.format(tax, '$')}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>總計 ({isTaxInclusive ? "含稅" : "未稅"})：</span>
            <span className="text-primary text-right w-[120px]">
              {MoneyHelper.format(grandTotal, '$')}
            </span>
          </div>
          {!isTaxInclusive && (
            <div className="text-xs text-muted-foreground text-right">
              （商品小計 + 運費 + 稅金 - 折扣）
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}