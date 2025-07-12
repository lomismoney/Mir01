# 📋 表單開發最佳實踐指南

本文檔總結了在庫存管理系統中開發表單的最佳實踐，基於我們在優化過程中的經驗和教訓。

## 🎯 核心原則

### 1. 統一的驗證架構
- **必須**使用 Zod 進行 schema 驗證
- **必須**使用 react-hook-form 管理表單狀態
- **必須**使用 zodResolver 整合驗證

### 2. 標準化的組件結構
- **必須**使用 StandardForm 組件系列
- **必須**保持一致的錯誤處理和顯示
- **必須**提供即時的用戶反饋

### 3. 性能優先
- **必須**避免不必要的重渲染
- **必須**使用適當的 memo 化策略
- **必須**優化大型表單的性能

---

## 🏗️ 表單架構

### 基本結構

```typescript
// 1. 定義 Zod Schema
const formSchema = z.object({
  name: z.string().min(1, "名稱為必填"),
  email: z.string().email("請輸入有效的電子郵件"),
  phone: z.string().optional(),
  // ... 其他欄位
});

// 2. 推導 TypeScript 類型
type FormData = z.infer<typeof formSchema>;

// 3. 創建表單組件
export function MyForm({ onSubmit, defaultValues }: MyFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* 表單內容 */}
      </form>
    </Form>
  );
}
```

### 使用 StandardForm 組件

```typescript
import { StandardForm, StandardFormField } from '@/components/forms/StandardForm';

export function CustomerForm({ onSubmit, defaultValues }: CustomerFormProps) {
  return (
    <StandardForm
      schema={customerSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
    >
      <StandardFormField
        name="name"
        label="客戶名稱"
        placeholder="請輸入客戶名稱"
        required
      />
      
      <StandardFormField
        name="email"
        label="電子郵件"
        type="email"
        placeholder="customer@example.com"
      />
      
      <StandardFormField
        name="phone"
        label="電話號碼"
        placeholder="0912-345-678"
      />
    </StandardForm>
  );
}
```

---

## 🎨 UI/UX 最佳實踐

### 1. 欄位標籤和提示

```typescript
<FormField
  control={form.control}
  name="price"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        售價 <span className="text-red-500">*</span>
      </FormLabel>
      <FormControl>
        <Input
          type="number"
          placeholder="0.00"
          {...field}
          onChange={(e) => field.onChange(parseFloat(e.target.value))}
        />
      </FormControl>
      <FormDescription>
        請輸入產品售價（含稅）
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 2. 動態表單陣列

使用 `useAppFieldArray` Hook 處理動態欄位：

```typescript
const { fields, append, remove, move } = useAppFieldArray({
  control: form.control,
  name: "items",
  keyName: "key", // 重要：使用 'key' 而非 'id'
});

return (
  <div>
    {fields.map((field, index) => (
      <div key={field.key} className="flex gap-2">
        <Input {...form.register(`items.${index}.name`)} />
        <Button onClick={() => remove(index)}>刪除</Button>
      </div>
    ))}
    <Button onClick={() => append({ name: "" })}>新增項目</Button>
  </div>
);
```

### 3. 條件顯示欄位

```typescript
const watchProductType = form.watch("productType");

return (
  <>
    <StandardFormField
      name="productType"
      label="產品類型"
      type="select"
      options={productTypeOptions}
    />
    
    {watchProductType === "variant" && (
      <StandardFormField
        name="variantOptions"
        label="變體選項"
        description="設定產品的變體屬性"
      />
    )}
  </>
);
```

---

## 🚀 性能優化

### 1. 避免不必要的重渲染

```typescript
// ❌ 錯誤：每次渲染都創建新函數
<Button onClick={() => handleDelete(item.id)}>刪除</Button>

// ✅ 正確：使用 useCallback
const handleDelete = useCallback((id: number) => {
  // 處理刪除
}, []);

<Button onClick={() => handleDelete(item.id)}>刪除</Button>
```

### 2. 大型表單優化

```typescript
// 使用 Controller 進行細粒度控制
<Controller
  control={form.control}
  name="description"
  render={({ field }) => (
    <RichTextEditor
      value={field.value}
      onChange={field.onChange}
      // 只在必要時重渲染
      shouldUnregister={false}
    />
  )}
/>
```

### 3. 異步驗證優化

```typescript
const emailSchema = z.string().email().refine(
  async (email) => {
    // 使用 debounce 減少 API 調用
    return await checkEmailAvailability(email);
  },
  {
    message: "此電子郵件已被使用",
  }
);
```

---

## 🛡️ 錯誤處理

### 1. 統一錯誤訊息

```typescript
// 在 schema 中定義清晰的錯誤訊息
const schema = z.object({
  age: z.number()
    .min(18, "年齡必須大於 18 歲")
    .max(100, "年齡必須小於 100 歲"),
  
  password: z.string()
    .min(8, "密碼至少需要 8 個字元")
    .regex(/[A-Z]/, "密碼必須包含至少一個大寫字母")
    .regex(/[0-9]/, "密碼必須包含至少一個數字"),
});
```

### 2. 伺服器端錯誤處理

```typescript
const mutation = useMutation({
  mutationFn: createCustomer,
  onError: (error) => {
    if (error.response?.data?.errors) {
      // 將伺服器錯誤映射到表單欄位
      Object.entries(error.response.data.errors).forEach(([field, messages]) => {
        form.setError(field as any, {
          type: "server",
          message: Array.isArray(messages) ? messages[0] : messages,
        });
      });
    } else {
      // 顯示通用錯誤
      toast.error("提交失敗，請稍後再試");
    }
  },
});
```

### 3. 防止重複提交

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
});

const onSubmit = async (data: FormData) => {
  try {
    await mutation.mutateAsync(data);
  } catch (error) {
    // 錯誤已在 mutation 中處理
  }
};

return (
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* 表單內容 */}
    <Button 
      type="submit" 
      disabled={form.formState.isSubmitting || mutation.isPending}
    >
      {form.formState.isSubmitting ? "提交中..." : "提交"}
    </Button>
  </form>
);
```

---

## 📦 表單元件庫

### 基礎輸入元件

```typescript
// 文字輸入
<StandardFormField
  name="name"
  label="名稱"
  placeholder="請輸入名稱"
  required
/>

// 數字輸入
<StandardFormField
  name="price"
  label="價格"
  type="number"
  placeholder="0.00"
  min={0}
  step={0.01}
/>

// 選擇器
<StandardFormField
  name="category"
  label="分類"
  type="select"
  options={categoryOptions}
  placeholder="請選擇分類"
/>

// 複選框
<StandardFormField
  name="isActive"
  label="啟用狀態"
  type="checkbox"
  description="勾選以啟用此項目"
/>

// 日期選擇
<StandardFormField
  name="date"
  label="日期"
  type="date"
  min={new Date().toISOString().split('T')[0]}
/>
```

### 進階元件

```typescript
// 圖片上傳
<FormField
  control={form.control}
  name="image"
  render={({ field }) => (
    <FormItem>
      <FormLabel>產品圖片</FormLabel>
      <FormControl>
        <ImageUpload
          value={field.value}
          onChange={field.onChange}
          maxSize={5 * 1024 * 1024} // 5MB
          accept="image/*"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// 標籤輸入
<FormField
  control={form.control}
  name="tags"
  render={({ field }) => (
    <FormItem>
      <FormLabel>標籤</FormLabel>
      <FormControl>
        <TagInput
          value={field.value}
          onChange={field.onChange}
          placeholder="輸入標籤後按 Enter"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 🧪 測試最佳實踐

### 1. 表單驗證測試

```typescript
describe('CustomerForm', () => {
  it('應該驗證必填欄位', async () => {
    const { getByRole, findByText } = render(
      <CustomerForm onSubmit={jest.fn()} />
    );
    
    const submitButton = getByRole('button', { name: /提交/i });
    fireEvent.click(submitButton);
    
    expect(await findByText('名稱為必填')).toBeInTheDocument();
  });
  
  it('應該驗證電子郵件格式', async () => {
    const { getByLabelText, getByRole, findByText } = render(
      <CustomerForm onSubmit={jest.fn()} />
    );
    
    const emailInput = getByLabelText('電子郵件');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = getByRole('button', { name: /提交/i });
    fireEvent.click(submitButton);
    
    expect(await findByText('請輸入有效的電子郵件')).toBeInTheDocument();
  });
});
```

### 2. 提交處理測試

```typescript
it('應該正確提交表單數據', async () => {
  const onSubmit = jest.fn();
  const { getByLabelText, getByRole } = render(
    <CustomerForm onSubmit={onSubmit} />
  );
  
  // 填寫表單
  fireEvent.change(getByLabelText('名稱'), { 
    target: { value: '測試客戶' } 
  });
  fireEvent.change(getByLabelText('電子郵件'), { 
    target: { value: 'test@example.com' } 
  });
  
  // 提交表單
  const submitButton = getByRole('button', { name: /提交/i });
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: '測試客戶',
      email: 'test@example.com',
    });
  });
});
```

---

## 📝 檢查清單

在完成表單開發前，請確認以下項目：

- [ ] 使用 Zod schema 進行驗證
- [ ] 使用 react-hook-form 管理狀態
- [ ] 所有必填欄位都有清晰標記
- [ ] 錯誤訊息使用中文且易於理解
- [ ] 提交按鈕在處理時禁用
- [ ] 處理伺服器端錯誤
- [ ] 支援鍵盤導航（Tab 順序正確）
- [ ] 在行動裝置上正常顯示
- [ ] 表單重置功能正常
- [ ] 適當的載入和成功反饋

---

## 🚫 常見錯誤

### 1. 直接修改表單值

```typescript
// ❌ 錯誤
form.watch('price') = 100;

// ✅ 正確
form.setValue('price', 100);
```

### 2. 忘記處理數值類型

```typescript
// ❌ 錯誤：onChange 返回字串
<Input type="number" {...field} />

// ✅ 正確：轉換為數字
<Input 
  type="number" 
  {...field}
  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
/>
```

### 3. 不當的預設值

```typescript
// ❌ 錯誤：可能導致 controlled/uncontrolled 警告
defaultValue={data?.name}

// ✅ 正確：提供穩定的預設值
defaultValue={data?.name || ''}
```

---

## 🎯 總結

遵循這些最佳實踐可以確保：

1. **一致性**：所有表單具有相同的行為和外觀
2. **可維護性**：易於理解和修改的代碼結構
3. **用戶體驗**：清晰的錯誤提示和流暢的互動
4. **性能**：優化的渲染和驗證邏輯
5. **可測試性**：易於編寫和維護測試

記住，好的表單不僅是功能正確，更要讓用戶感到愉悅和高效。