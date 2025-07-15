/**
 * 客戶管理表單驗證 Schema
 * 
 * 定義所有客戶相關表單的 Zod 驗證規則
 */

import { z } from "zod";
import {
  name,
  email,
  phoneNumber,
  address,
  taiwanTaxId,
  optionalString,
  requiredString,
  booleanStatus,
  notes,
  nonEmptyArray,
} from "./common";

// ============================================================================
// 客戶地址 Schema
// ============================================================================

/** 客戶地址驗證 */
export const customerAddressSchema = z.object({
  id: z.number().optional(),
  type: z.enum(["billing", "shipping"], {
    required_error: "請選擇地址類型",
  }),
  contact_name: requiredString("聯絡人姓名為必填"),
  phone: phoneNumber,
  address_line_1: address,
  address_line_2: optionalString,
  city: requiredString("城市為必填"),
  state: requiredString("縣市為必填"),
  postal_code: z
    .string()
    .regex(/^\d{3}(\d{2})?$/, "請輸入有效的郵遞區號")
    .optional(),
  country: z.string().default("台灣"),
  is_default: booleanStatus,
});

// ============================================================================
// 客戶基本資料 Schema
// ============================================================================

/** 基礎客戶 Schema（不包含驗證規則） */
const baseCustomerSchema = z.object({
  // 基本資訊
  name: name,
  phone: phoneNumber,
  
  // 公司資訊
  is_company: booleanStatus,
  company: optionalString,
  tax_number: optionalString,
  industry_type: optionalString,
  
  // 付款方式
  payment_type: z.enum(["cash", "credit", "transfer", "check"], {
    required_error: "請選擇付款方式",
  }).default("cash"),
  
  // 聯絡資訊
  contact_address: optionalString,
  
  // 狀態
  is_active: booleanStatus.default(true),
  
  // 備註
  note: notes,
  
  // 地址列表
  addresses: z.array(customerAddressSchema).optional().default([]),
});

/** 創建客戶驗證 */
export const createCustomerSchema = baseCustomerSchema.refine((data) => {
  // 當 is_company 為 true 時，tax_number 必須填寫且符合格式
  if (data.is_company) {
    return data.tax_number && /^\d{8}$/.test(data.tax_number);
  }
  return true;
}, {
  message: "公司客戶必須填寫8位數字的統一編號",
  path: ["tax_number"],
});

/** 更新客戶驗證 */
export const updateCustomerSchema = baseCustomerSchema.partial().extend({
  id: z.number().positive("無效的客戶 ID"),
}).refine((data) => {
  // 當 is_company 為 true 時，tax_number 必須填寫且符合格式
  if (data.is_company) {
    return data.tax_number && /^\d{8}$/.test(data.tax_number);
  }
  return true;
}, {
  message: "公司客戶必須填寫8位數字的統一編號",
  path: ["tax_number"],
});

// ============================================================================
// 客戶搜尋和篩選 Schema
// ============================================================================

/** 客戶篩選參數驗證 */
export const customerFiltersSchema = z.object({
  search: z.string().max(100).optional(),
  is_company: z.boolean().optional(),
  payment_type: z.enum(["cash", "credit", "transfer", "check"]).optional(),
  is_active: z.boolean().optional(),
  industry_type: z.string().optional(),
  created_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  created_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(15),
});

// ============================================================================
// 客戶匯入 Schema
// ============================================================================

/** 批量匯入客戶驗證 */
export const importCustomersSchema = z.object({
  customers: nonEmptyArray(
    baseCustomerSchema.omit({ addresses: true }),
    "至少需要一個客戶資料"
  ),
  overwrite_existing: booleanStatus.default(false),
  send_welcome_email: booleanStatus.default(false),
});

// ============================================================================
// 客戶關係管理 Schema
// ============================================================================

/** 客戶標籤驗證 */
export const customerTagSchema = z.object({
  id: z.number().optional(),
  name: requiredString("標籤名稱為必填"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "請輸入有效的顏色代碼")
    .default("#3b82f6"),
  description: optionalString,
});

/** 為客戶添加標籤驗證 */
export const addCustomerTagSchema = z.object({
  customer_id: z.number().positive("無效的客戶 ID"),
  tag_ids: nonEmptyArray(
    z.number().positive("無效的標籤 ID"),
    "至少需要選擇一個標籤"
  ),
});

// ============================================================================
// 客戶通訊記錄 Schema
// ============================================================================

/** 客戶通訊記錄驗證 */
export const customerCommunicationSchema = z.object({
  customer_id: z.number().positive("無效的客戶 ID"),
  type: z.enum(["email", "phone", "meeting", "note"], {
    required_error: "請選擇通訊類型",
  }),
  subject: requiredString("主題為必填"),
  content: requiredString("內容為必填"),
  contact_date: z.string().datetime("請輸入有效的聯絡時間"),
  next_follow_up: z.string().datetime().optional(),
  attachments: z.array(z.string().url()).optional().default([]),
});

// ============================================================================
// 客戶統計 Schema
// ============================================================================

/** 客戶統計查詢參數驗證 */
export const customerStatsSchema = z.object({
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  group_by: z.enum(["day", "week", "month", "year"]).default("month"),
  include_inactive: booleanStatus.default(false),
});

// ============================================================================
// 客戶驗證 Schema
// ============================================================================

/** 客戶身份驗證資料 */
export const customerVerificationSchema = z.object({
  customer_id: z.number().positive("無效的客戶 ID"),
  verification_type: z.enum(["phone", "email", "identity"], {
    required_error: "請選擇驗證類型",
  }),
  verification_code: z
    .string()
    .length(6, "驗證碼必須為6位數")
    .regex(/^\d{6}$/, "驗證碼只能包含數字"),
  expires_at: z.string().datetime("請輸入有效的過期時間"),
});

// ============================================================================
// 匯出的類型定義
// ============================================================================

export type CustomerAddress = z.infer<typeof customerAddressSchema>;
export type CreateCustomerData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerData = z.infer<typeof updateCustomerSchema>;
export type CustomerFilters = z.infer<typeof customerFiltersSchema>;
export type ImportCustomersData = z.infer<typeof importCustomersSchema>;
export type CustomerTag = z.infer<typeof customerTagSchema>;
export type AddCustomerTagData = z.infer<typeof addCustomerTagSchema>;
export type CustomerCommunication = z.infer<typeof customerCommunicationSchema>;
export type CustomerStats = z.infer<typeof customerStatsSchema>;
export type CustomerVerification = z.infer<typeof customerVerificationSchema>;

// ============================================================================
// 預設值
// ============================================================================

/** 新客戶預設值 */
export const defaultCustomerValues: Partial<CreateCustomerData> = {
  is_company: false,
  payment_type: "cash",
  is_active: true,
  addresses: [],
};

/** 新地址預設值 */
export const defaultAddressValues: Partial<CustomerAddress> = {
  type: "billing",
  country: "台灣",
  is_default: false,
};

// ============================================================================
// 驗證工具函數
// ============================================================================

/** 驗證客戶是否為公司 */
export const validateCompanyCustomer = (data: CreateCustomerData | UpdateCustomerData) => {
  if (data.is_company && (!data.company || !data.tax_number)) {
    throw new Error("公司客戶必須填寫公司名稱和統一編號");
  }
  return true;
};

/** 驗證地址完整性 */
export const validateAddressCompleteness = (address: CustomerAddress) => {
  const requiredFields = ["contact_name", "address_line_1", "city", "state"];
  const missingFields = requiredFields.filter(field => !address[field as keyof CustomerAddress]);
  
  if (missingFields.length > 0) {
    throw new Error(`地址資料不完整，缺少：${missingFields.join(", ")}`);
  }
  return true;
};

/** 驗證預設地址唯一性 */
export const validateDefaultAddressUniqueness = (addresses: CustomerAddress[], type: "billing" | "shipping") => {
  const defaultAddresses = addresses.filter(addr => addr.type === type && addr.is_default);
  
  if (defaultAddresses.length > 1) {
    throw new Error(`${type === "billing" ? "帳單" : "送貨"}地址只能有一個預設地址`);
  }
  return true;
};