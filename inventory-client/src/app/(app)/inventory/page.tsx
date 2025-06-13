import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '庫存管理',
  description: '管理庫存與庫存轉移',
};

/**
 * 庫存管理主入口頁面
 * 自動導向至庫存管理頁面
 */
export default function InventoryPage() {
  // 預設重定向到庫存管理頁面
  redirect('/inventory/management');
} 