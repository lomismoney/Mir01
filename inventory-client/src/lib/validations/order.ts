/**
 * 訂單管理表單驗證 Schema
 */

import { z } from "zod";
import {
  databaseId,
  optionalDatabaseId,
  price,
  quantity,
  optionalString,
  requiredString,
  dateString,
  notes,
  status,
} from "./common";

export const orderItemSchema = z.object({
  product_variant_id: databaseId,
  quantity: quantity,
  unit_price: price,
  notes: optionalString,
});

export const createOrderSchema = z.object({
  customer_id: databaseId,
  store_id: databaseId,
  order_date: dateString,
  delivery_date: dateString,
  shipping_address: optionalString,
  notes: notes,
  items: z.array(orderItemSchema).min(1, "訂單至少需要一個項目"),
});

export const updateOrderSchema = createOrderSchema.partial().extend({
  id: databaseId,
});

export const orderFiltersSchema = z.object({
  search: optionalString,
  status: status(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  customer_id: z.number().optional(),
  store_id: z.number().optional(),
  start_date: dateString,
  end_date: dateString,
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(15),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrderData = z.infer<typeof createOrderSchema>;
export type UpdateOrderData = z.infer<typeof updateOrderSchema>;
export type OrderFilters = z.infer<typeof orderFiltersSchema>;