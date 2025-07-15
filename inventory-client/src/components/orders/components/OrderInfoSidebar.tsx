import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { CustomerSelector } from "../CustomerSelector";
import { StoreCombobox } from "@/components/ui/store-combobox";
import { OrderFormValues } from "../hooks/useOrderForm";

interface OrderInfoSidebarProps {
  form: UseFormReturn<OrderFormValues>;
  onAddNewCustomer: () => void;
}

export function OrderInfoSidebar({
  form,
  onAddNewCustomer,
}: OrderInfoSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>訂單資訊</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* 門市資訊區塊 */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              門市資訊
            </div>
            <FormField
              control={form.control}
              name="store_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>選擇門市</FormLabel>
                  <FormControl>
                    <StoreCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="請選擇門市..."
                      emptyText="未找到門市"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t"></div>

          {/* 客戶資訊區塊 */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              客戶資訊
            </div>
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>選擇客戶</FormLabel>
                  <CustomerSelector
                    selectedCustomerId={field.value}
                    onSelectCustomer={(customer) => {
                      if (customer) {
                        form.setValue("customer_id", customer.id!);
                        form.setValue(
                          "shipping_address",
                          customer.contact_address || ""
                        );
                      }
                    }}
                    onAddNewCustomer={onAddNewCustomer}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shipping_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>運送地址</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="請輸入運送地址..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t"></div>

          {/* 優先級設定區塊 */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              優先級設定
            </div>
            <FormField
              control={form.control}
              name="fulfillment_priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>履行優先級</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇優先級" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">低優先級</SelectItem>
                      <SelectItem value="normal">一般優先級</SelectItem>
                      <SelectItem value="high">高優先級</SelectItem>
                      <SelectItem value="urgent">緊急</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>優先級原因（選填）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="如為高優先級或緊急訂單，請說明原因..."
                      className="resize-none min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t"></div>

          {/* 付款與來源資訊區塊 */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              付款與來源
            </div>
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>付款方式</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇付款方式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="現金">現金</SelectItem>
                      <SelectItem value="轉帳">轉帳</SelectItem>
                      <SelectItem value="刷卡">刷卡</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>客戶來源</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇客戶來源" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="現場客戶">
                        現場客戶
                      </SelectItem>
                      <SelectItem value="網站客戶">
                        網站客戶
                      </SelectItem>
                      <SelectItem value="LINE客戶">
                        LINE客戶
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}