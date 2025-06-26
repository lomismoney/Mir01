import { Metadata } from "next";

export const metadata: Metadata = {
  title: "庫存管理",
  description: "管理門市商品庫存",
};

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
