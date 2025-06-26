import { Metadata } from "next";

export const metadata: Metadata = {
  title: "進貨管理",
  description: "管理商品進貨和入庫作業",
};

/**
 * 進貨管理布局
 */
export default function PurchasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
