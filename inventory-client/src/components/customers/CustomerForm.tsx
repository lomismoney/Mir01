"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, PlusCircle, AlertCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useCheckCustomerExistence } from "@/hooks";
// 假設 Customer 類型已在 api-helpers 中定義
import { Customer } from "@/types/api-helpers";

// 地址驗證 schema
const addressSchema = z.object({
  id: z.number().optional(), // 用於編輯模式
  address: z.string().min(1, "地址不能為空"),
  is_default: z.boolean(),
});

// 1. 使用 Zod 定義表單驗證 schema，與後端 StoreCustomerRequest 保持一致
const formSchema = z.object({
  name: z.string().min(1, "客戶名稱為必填"),
  phone: z.string().optional(),
  is_company: z.boolean(),
  tax_id: z.string().optional(),
  industry_type: z.string().min(1, "行業別為必填"),
  payment_type: z.string().min(1, "付款類別為必填"),
  contact_address: z.string().optional(),
  // 新增 addresses 陣列驗證
  addresses: z.array(addressSchema).optional(),
});

type CustomerFormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  initialData?: Partial<Customer>; // 用於編輯模式的初始數據
  isSubmitting: boolean;
  onSubmit: (values: CustomerFormValues) => void;
}

export function CustomerForm({
  initialData,
  isSubmitting,
  onSubmit,
}: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      is_company: initialData?.is_company || false,
      tax_id: initialData?.tax_id || "",
      industry_type: initialData?.industry_type || "",
      payment_type: initialData?.payment_type || "",
      contact_address: initialData?.contact_address || "",
      addresses: initialData?.addresses || [],
    },
  });

  const isCompany = form.watch("is_company");

  // 監聽姓名和電話欄位的變化
  const [name, phone] = form.watch(["name", "phone"]);
  const debouncedName = useDebounce(name, 500); // 對姓名進行防抖

  // 使用客戶名稱檢查 Hook
  const { data: existenceData, refetch } =
    useCheckCustomerExistence(debouncedName);

  // 使用 useEffect 觸發檢查
  useEffect(() => {
    // 只有在「姓名有值」且「電話為空」時，才觸發檢查
    if (debouncedName && !phone) {
      refetch();
    }
  }, [debouncedName, phone, refetch]);

  // 在 isCompany 之後添加 useFieldArray
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "addresses",
  });

  return (
    <Form {...form} data-oid="m..or67">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        data-oid="a.-o.tm"
      >
        {/* 基本資訊區塊 */}
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          data-oid="s0ze.8m"
        >
          {/* 客戶名稱/公司抬頭 */}
          <div data-oid="n5ysy17">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem data-oid="qtnb95s">
                  <FormLabel data-oid=".wjhaec">
                    {isCompany ? "公司抬頭" : "客戶姓名"}
                  </FormLabel>
                  <FormControl data-oid=":wb28f-">
                    <Input
                      placeholder={
                        isCompany ? "請輸入公司全名" : "請輸入客戶姓名"
                      }
                      {...field}
                      data-oid="3sd9802"
                    />
                  </FormControl>
                  <FormMessage data-oid="3xhogie" />
                </FormItem>
              )}
              data-oid="jeo46ps"
            />

            {existenceData?.exists && (
              <Alert variant="destructive" className="mt-2" data-oid=":bloet0">
                <AlertCircle className="h-4 w-4" data-oid="lah-0a_" />
                <AlertDescription data-oid="-w_922-">
                  警告：系統中已存在同名客戶。建議填寫電話號碼以作區分，或確認是否為同一人。
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* 聯絡電話 */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem data-oid="tedhcsx">
                <FormLabel data-oid="dt9x0na">聯絡電話</FormLabel>
                <FormControl data-oid="m2kgvi0">
                  <Input
                    placeholder="請輸入聯絡電話"
                    {...field}
                    data-oid="ku531y7"
                  />
                </FormControl>
                <FormMessage data-oid="_0yxyga" />
              </FormItem>
            )}
            data-oid="htsuywx"
          />

          {/* 公司戶複選框 */}
          <FormField
            control={form.control}
            name="is_company"
            render={({ field }) => (
              <FormItem
                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2"
                data-oid="m2t6tyj"
              >
                <FormControl data-oid="p79_-zq">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-oid="i62kh_6"
                  />
                </FormControl>
                <div className="space-y-1 leading-none" data-oid="9dr4bv_">
                  <FormLabel data-oid="pvvvrgp">此為公司戶</FormLabel>
                </div>
              </FormItem>
            )}
            data-oid="cet9.ra"
          />

          {/* 統一編號 - 條件渲染 */}
          {isCompany && (
            <FormField
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <FormItem data-oid="z5_j10j">
                  <FormLabel data-oid="jcekshb">統一編號</FormLabel>
                  <FormControl data-oid="n.7nmbl">
                    <Input
                      placeholder="請輸入公司統一編號"
                      {...field}
                      data-oid="jy2f5_w"
                    />
                  </FormControl>
                  <FormMessage data-oid="t90s4m9" />
                </FormItem>
              )}
              data-oid="dw79mdd"
            />
          )}

          {/* 客戶行業別 */}
          <FormField
            control={form.control}
            name="industry_type"
            render={({ field }) => (
              <FormItem data-oid="po:x_w6">
                <FormLabel data-oid="sp2ngm1">客戶行業別</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  data-oid="lt9iw03"
                >
                  <FormControl data-oid="jdhuxky">
                    <SelectTrigger data-oid="hxtk9rg">
                      <SelectValue
                        placeholder="請選擇行業別"
                        data-oid="qnxe:wv"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent data-oid="wmq94b-">
                    <SelectItem value="一般客戶" data-oid="l-eqoc7">
                      一般客戶
                    </SelectItem>
                    <SelectItem value="設計師" data-oid=":l9hnoq">
                      設計師
                    </SelectItem>
                    <SelectItem value="建設公司" data-oid="_dk7xk5">
                      建設公司
                    </SelectItem>
                    <SelectItem value="統包工程商" data-oid="uibugem">
                      統包工程商
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage data-oid=".gme821" />
              </FormItem>
            )}
            data-oid="pae4vyy"
          />

          {/* 付款類別 */}
          <FormField
            control={form.control}
            name="payment_type"
            render={({ field }) => (
              <FormItem data-oid="903p8.q">
                <FormLabel data-oid="w20xyv3">付款類別</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  data-oid=".si8gjd"
                >
                  <FormControl data-oid="e64aq7:">
                    <SelectTrigger data-oid="w4oaelq">
                      <SelectValue
                        placeholder="請選擇付款類別"
                        data-oid="2y69lb1"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent data-oid="n1_tipk">
                    <SelectItem value="現金付款" data-oid="jv-jw7h">
                      現金付款
                    </SelectItem>
                    <SelectItem value="月結客戶" data-oid=".ox2553">
                      月結客戶
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage data-oid="8fxdosk" />
              </FormItem>
            )}
            data-oid="gz25hty"
          />

          {/* 主要聯絡地址 */}
          <FormField
            control={form.control}
            name="contact_address"
            render={({ field }) => (
              <FormItem className="md:col-span-2" data-oid="kdngpp3">
                <FormLabel data-oid="kf46b7r">主要聯絡地址</FormLabel>
                <FormControl data-oid="5sdyg.k">
                  <Input
                    placeholder="請輸入主要聯絡地址"
                    {...field}
                    data-oid="fj04psb"
                  />
                </FormControl>
                <FormMessage data-oid="72wj45k" />
              </FormItem>
            )}
            data-oid="34a.6lo"
          />
        </div>

        {/* 動態地址管理區塊 */}
        <div className="space-y-4" data-oid="l1ha-oc">
          <div data-oid="c.2thj6">
            <h3 className="text-lg font-medium" data-oid="hsv11db">
              運送地址管理
            </h3>
            <p className="text-sm text-muted-foreground" data-oid="2r:mg67">
              可以為此客戶添加多個運送地址。
            </p>
          </div>

          <div className="space-y-4" data-oid="34l4.k0">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center space-x-2 rounded-md border p-4"
                data-oid="ui_lpwg"
              >
                <FormField
                  control={form.control}
                  name={`addresses.${index}.address`}
                  render={({ field }) => (
                    <FormItem className="flex-grow" data-oid="uqx__8m">
                      <FormControl data-oid="zfoxtir">
                        <Input
                          placeholder={`地址 ${index + 1}`}
                          {...field}
                          data-oid="a5ai65_"
                        />
                      </FormControl>
                      <FormMessage data-oid="46ylclp" />
                    </FormItem>
                  )}
                  data-oid="l35ublj"
                />

                <FormField
                  control={form.control}
                  name={`addresses.${index}.is_default`}
                  render={({ field }) => (
                    <FormItem
                      className="flex flex-row items-center space-x-2 pt-2"
                      data-oid="bad5hyh"
                    >
                      <FormControl data-oid="c:_vouz">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            // 確保只有一個預設地址
                            if (checked) {
                              form.getValues("addresses")?.forEach((_, i) => {
                                if (i !== index) {
                                  form.setValue(
                                    `addresses.${i}.is_default`,
                                    false,
                                  );
                                }
                              });
                            }
                            field.onChange(checked);
                          }}
                          data-oid="g0gttlj"
                        />
                      </FormControl>
                      <FormLabel
                        className="text-sm font-normal"
                        data-oid="5bj_ndu"
                      >
                        設為預設
                      </FormLabel>
                    </FormItem>
                  )}
                  data-oid="_pi.6ue"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  data-testid={`delete-address-${index}`}
                  data-oid="31i.or8"
                >
                  <Trash2 className="h-4 w-4" data-oid="3h5jig3" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ address: "", is_default: fields.length === 0 })
            }
            data-oid="0erwr.0"
          >
            <PlusCircle className="mr-2 h-4 w-4" data-oid="21z7oow" />
            新增地址
          </Button>
        </div>

        <Button type="submit" disabled={isSubmitting} data-oid="dl3u_fo">
          {isSubmitting ? "儲存中..." : "儲存客戶"}
        </Button>
      </form>
    </Form>
  );
}
