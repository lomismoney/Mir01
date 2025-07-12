import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { OrderFormValues } from "../hooks/useOrderForm";

interface OrderNotesProps {
  form: UseFormReturn<OrderFormValues>;
}

export function OrderNotes({ form }: OrderNotesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>訂單備註</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="輸入此訂單的內部備註..."
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}