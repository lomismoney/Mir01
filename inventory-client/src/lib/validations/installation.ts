/**
 * 安裝管理表單驗證 Schema
 */

import { z } from "zod";
import {
  name,
  phoneNumber,
  address,
  databaseId,
  optionalDatabaseId,
  quantity,
  dateString,
  notes,
  optionalString,
  status,
} from "./common";

export const installationItemSchema = z.object({
  order_item_id: optionalDatabaseId,
  product_variant_id: optionalDatabaseId,
  product_name: optionalString,
  sku: optionalString,
  quantity: quantity,
  specifications: optionalString,
  notes: notes,
});

export const createInstallationSchema = z.object({
  customer_name: name,
  customer_phone: phoneNumber,
  installation_address: address,
  installer_user_id: optionalDatabaseId,
  scheduled_date: dateString,
  notes: notes,
  items: z.array(installationItemSchema).min(1, "安裝單至少需要一個項目"),
});

export const updateInstallationSchema = createInstallationSchema.partial().extend({
  id: databaseId,
});

export const createInstallationFromOrderSchema = z.object({
  order_id: databaseId,
  installer_user_id: optionalDatabaseId,
  scheduled_date: dateString,
  notes: notes,
  selected_items: z.array(databaseId).optional(),
});

export const assignInstallerSchema = z.object({
  installation_id: databaseId,
  installer_user_id: databaseId,
  scheduled_date: dateString,
  notes: notes,
});

export const updateInstallationStatusSchema = z.object({
  installation_id: databaseId,
  status: status(["pending", "scheduled", "in_progress", "completed", "cancelled"]),
  reason: optionalString,
});

export const installationFiltersSchema = z.object({
  search: optionalString,
  status: status(["pending", "scheduled", "in_progress", "completed", "cancelled"]).optional(),
  installer_user_id: z.number().optional(),
  start_date: dateString,
  end_date: dateString,
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(15),
});

export type InstallationItem = z.infer<typeof installationItemSchema>;
export type CreateInstallationData = z.infer<typeof createInstallationSchema>;
export type UpdateInstallationData = z.infer<typeof updateInstallationSchema>;
export type CreateInstallationFromOrderData = z.infer<typeof createInstallationFromOrderSchema>;
export type AssignInstallerData = z.infer<typeof assignInstallerSchema>;
export type UpdateInstallationStatusData = z.infer<typeof updateInstallationStatusSchema>;
export type InstallationFilters = z.infer<typeof installationFiltersSchema>;