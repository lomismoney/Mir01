import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { OrderFormValues } from "../hooks/useOrderForm";

interface PriceSummaryProps {
  form: UseFormReturn<OrderFormValues>;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
}

export function PriceSummary({
  form,
  subtotal,
  shippingFee,
  tax,
  discountAmount,
  grandTotal,
}: PriceSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>價格摘要</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            name="tax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>稅金</FormLabel>
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
            <span>小計：</span>
            <span className="font-medium text-right w-[120px]">
              ${Math.round(subtotal).toLocaleString()}
            </span>
          </div>
          {shippingFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>運費：</span>
              <span className="font-medium text-right w-[120px]">
                ${Math.round(shippingFee).toLocaleString()}
              </span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>稅金：</span>
              <span className="font-medium text-right w-[120px]">
                ${Math.round(tax).toLocaleString()}
              </span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>折扣：</span>
              <span className="font-medium text-right w-[120px]">
                -${Math.round(discountAmount).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>總計：</span>
            <span className="text-primary text-right w-[120px]">
              ${Math.round(grandTotal).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}