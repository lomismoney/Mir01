import { Metadata } from "next";

export const metadata: Metadata = {
  title: "庫存轉移",
  description: "在不同分店之間轉移商品庫存",
};

export default function TransfersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
