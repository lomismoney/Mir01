import { Metadata } from "next";

export const metadata: Metadata = {
  title: "商品入庫",
  description: "專注於商品入庫操作和歷史記錄管理",
};

export default function IncomingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
