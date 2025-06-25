import { Metadata } from "next";

export const metadata: Metadata = {
  title: "庫存管理系統",
  description: "管理商品庫存、轉移與清點",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
