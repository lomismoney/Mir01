/**
 * 分類管理表單驗證 Schema
 */

import { z } from "zod";
import {
  name,
  description,
  optionalDatabaseId,
  databaseId,
  optionalString,
} from "./common";

export const createCategorySchema = z.object({
  name: name,
  description: description,
  parent_id: optionalDatabaseId,
  sort_order: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: databaseId,
});

export const categoryFiltersSchema = z.object({
  search: optionalString,
  parent_id: z.number().optional(),
});

export const reorderCategoriesSchema = z.object({
  items: z.array(z.object({
    id: databaseId,
    sort_order: z.number().int().min(0),
  })).min(1, "至少需要一個分類項目"),
});

export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
export type CategoryFilters = z.infer<typeof categoryFiltersSchema>;
export type ReorderCategoriesData = z.infer<typeof reorderCategoriesSchema>;