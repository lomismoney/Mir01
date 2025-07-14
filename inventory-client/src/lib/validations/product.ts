/**
 * 商品管理表單驗證 Schema
 */

import { z } from "zod";
import {
  name,
  description,
  sku,
  price,
  optionalString,
  requiredString,
  databaseId,
  optionalDatabaseId,
  nonEmptyArray,
  optionalImageFile,
} from "./common";

export const createProductSchema = z.object({
  name: name,
  description: description,
  category_id: optionalDatabaseId,
  image: optionalImageFile,
  attributes: z.array(databaseId).default([]),
  variants: nonEmptyArray(z.object({
    sku: sku,
    price: price,
    attribute_values: z.array(z.object({
      attribute_id: databaseId,
      value: requiredString("屬性值為必填"),
    })).default([]),
  }), "至少需要一個商品變體"),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: databaseId,
});

export const productFiltersSchema = z.object({
  search: optionalString,
  category_id: z.number().optional(),
  store_id: z.number().optional(),
  low_stock: z.boolean().optional(),
  out_of_stock: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(15),
});

export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;