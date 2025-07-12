import { Controller, UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { RefundFormValues } from "../hooks/useRefundForm";

interface RefundInfoFormProps {
  form: UseFormReturn<RefundFormValues>;
}

export function RefundInfoForm({ form }: RefundInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. 填寫退款資訊</CardTitle>
        <CardDescription>
          請提供退款原因及相關說明
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 退款原因 */}
        <div className="space-y-2">
          <Label htmlFor="reason">
            退款原因 <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="reason"
            control={form.control}
            render={({ field, fieldState }) => (
              <>
                <Textarea
                  {...field}
                  id="reason"
                  placeholder="請詳細說明退款原因..."
                  className="min-h-[100px] resize-none"
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </div>

        {/* 備註說明 */}
        <div className="space-y-2">
          <Label htmlFor="notes">備註說明</Label>
          <Controller
            name="notes"
            control={form.control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="notes"
                placeholder="選填：其他補充說明..."
                className="resize-none"
              />
            )}
          />
        </div>

        {/* 重新入庫選項 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="should_restock"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="restock"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="restock" className="cursor-pointer font-normal">
              將退貨商品加回庫存
            </Label>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              勾選此選項將自動將退貨商品數量加回相應的庫存
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}