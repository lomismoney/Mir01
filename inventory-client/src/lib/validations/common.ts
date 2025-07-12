/**
 * 通用表單驗證標準
 * 
 * 提供可重用的 Zod schema 驗證規則，確保整個應用程式的驗證邏輯一致性
 */

import { z } from "zod";

// ============================================================================
// 基本類型驗證
// ============================================================================

/** 必填字串驗證 */
export const requiredString = (message = "此欄位為必填") => 
  z.string().min(1, message).trim();

/** 可選字串驗證 */
export const optionalString = z.string().optional().or(z.literal(""));

/** 必填數字驗證 */
export const requiredNumber = (message = "請輸入有效數字") => 
  z.number({ required_error: message, invalid_type_error: message });

/** 可選數字驗證 */
export const optionalNumber = z.number().optional();

/** 正整數驗證 */
export const positiveInteger = (message = "請輸入正整數") => 
  z.number().int().positive(message);

/** 非負整數驗證 */
export const nonNegativeInteger = (message = "請輸入非負整數") => 
  z.number().int().min(0, message);

// ============================================================================
// 業務邏輯驗證
// ============================================================================

/** 電話號碼驗證 */
export const phoneNumber = z
  .string()
  .regex(/^[0-9+\-\s()]+$/, "請輸入有效的電話號碼")
  .min(8, "電話號碼至少需要8位數")
  .max(20, "電話號碼不能超過20位數")
  .optional();

/** 電子郵件驗證 */
export const email = z
  .string()
  .email("請輸入有效的電子郵件地址")
  .optional();

/** SKU 驗證 */
export const sku = z
  .string()
  .min(1, "SKU 不能為空")
  .max(50, "SKU 不能超過50字元")
  .regex(/^[A-Za-z0-9\-_]+$/, "SKU 只能包含字母、數字、連字符和底線");

/** 價格驗證 */
export const price = z
  .number()
  .positive("價格必須大於0")
  .max(999999.99, "價格不能超過999,999.99");

/** 數量驗證 */
export const quantity = z
  .number()
  .int("數量必須為整數")
  .min(1, "數量至少為1")
  .max(99999, "數量不能超過99,999");

/** 庫存數量驗證（允許0） */
export const stockQuantity = z
  .number()
  .int("庫存數量必須為整數")
  .min(0, "庫存數量不能為負數")
  .max(99999, "庫存數量不能超過99,999");

/** 百分比驗證 */
export const percentage = z
  .number()
  .min(0, "百分比不能小於0")
  .max(100, "百分比不能大於100");

// ============================================================================
// 日期和時間驗證
// ============================================================================

/** 日期字串驗證 (YYYY-MM-DD) */
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "請輸入有效的日期格式 (YYYY-MM-DD)")
  .optional();

/** 必填日期字串驗證 */
export const requiredDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "請輸入有效的日期格式 (YYYY-MM-DD)")
  .min(1, "日期為必填");

/** 時間字串驗證 (HH:MM) */
export const timeString = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "請輸入有效的時間格式 (HH:MM)")
  .optional();

/** 日期時間字串驗證 (ISO 8601) */
export const dateTimeString = z
  .string()
  .datetime("請輸入有效的日期時間格式")
  .optional();

// ============================================================================
// 地址驗證
// ============================================================================

/** 基本地址驗證 */
export const address = z
  .string()
  .min(5, "地址至少需要5個字元")
  .max(200, "地址不能超過200個字元");

/** 郵遞區號驗證（台灣） */
export const postalCode = z
  .string()
  .regex(/^\d{3}(\d{2})?$/, "請輸入有效的郵遞區號")
  .optional();

// ============================================================================
// ID 驗證
// ============================================================================

/** 資料庫 ID 驗證 */
export const databaseId = z
  .number()
  .int("ID 必須為整數")
  .positive("ID 必須為正數");

/** 可選的資料庫 ID 驗證 */
export const optionalDatabaseId = z
  .number()
  .int("ID 必須為整數")
  .positive("ID 必須為正數")
  .optional()
  .nullable();

// ============================================================================
// 陣列驗證
// ============================================================================

/** 非空陣列驗證 */
export const nonEmptyArray = <T>(schema: z.ZodType<T>, message = "至少需要一個項目") =>
  z.array(schema).min(1, message);

/** 可選陣列驗證 */
export const optionalArray = <T>(schema: z.ZodType<T>) =>
  z.array(schema).optional().default([]);

// ============================================================================
// 檔案驗證
// ============================================================================

/** 圖片檔案驗證 */
export const imageFile = z
  .instanceof(File)
  .refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB
    "檔案大小不能超過5MB"
  )
  .refine(
    (file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
    "只允許 JPEG、PNG 或 WebP 格式的圖片"
  );

/** 可選圖片檔案驗證 */
export const optionalImageFile = imageFile.optional().nullable();

// ============================================================================
// 狀態驗證
// ============================================================================

/** 通用狀態驗證 */
export const status = (allowedStatuses: readonly string[]) =>
  z.enum(allowedStatuses as [string, ...string[]]);

/** 布林狀態驗證 */
export const booleanStatus = z.boolean().default(false);

// ============================================================================
// 複合驗證
// ============================================================================

/** 名稱驗證（適用於客戶、商品、分類等） */
export const name = z
  .string()
  .min(1, "名稱為必填")
  .max(100, "名稱不能超過100個字元")
  .trim();

/** 描述驗證 */
export const description = z
  .string()
  .max(1000, "描述不能超過1000個字元")
  .optional();

/** 備註驗證 */
export const notes = z
  .string()
  .max(500, "備註不能超過500個字元")
  .optional();

// ============================================================================
// 台灣特定驗證
// ============================================================================

/** 統一編號驗證 */
export const taiwanTaxId = z
  .string()
  .regex(/^\d{8}$/, "統一編號必須為8位數字")
  .optional();

/** 台灣身分證號驗證 */
export const taiwanIdCard = z
  .string()
  .regex(/^[A-Z][12]\d{8}$/, "請輸入有效的身分證號")
  .optional();

// ============================================================================
// 分頁驗證
// ============================================================================

/** 分頁參數驗證 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(15),
});

/** 搜尋參數驗證 */
export const searchSchema = z.object({
  search: z.string().max(100).optional(),
  ...paginationSchema.shape,
});

// ============================================================================
// 表單提交驗證
// ============================================================================

/** 確認密碼驗證 */
export const passwordConfirmation = (passwordField = "password") =>
  z.object({
    [passwordField]: z.string().min(8, "密碼至少需要8個字元"),
    confirmPassword: z.string(),
  }).refine(
    (data) => data[passwordField as keyof typeof data] === data.confirmPassword,
    {
      message: "密碼確認不一致",
      path: ["confirmPassword"],
    }
  );

/** 同意條款驗證 */
export const termsAgreement = z
  .boolean()
  .refine((val) => val === true, "必須同意條款才能繼續");

// ============================================================================
// 工具函數
// ============================================================================

/** 移除空值和未定義值的物件清理器 */
export const cleanObject = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== "") {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  }
  
  return cleaned;
};

/** 建立條件式驗證 */
export const conditionalSchema = <T>(
  condition: boolean,
  trueSchema: z.ZodType<T>,
  falseSchema: z.ZodType<T>
) => {
  return condition ? trueSchema : falseSchema;
};