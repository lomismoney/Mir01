"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Customer } from "@/types/api-helpers";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteCustomer } from "@/hooks/queries/useEntityQueries";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";

export const columns: ColumnDef<Customer>[] = [
  // 選擇欄位
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="全選"
        className="translate-y-[2px]"
      />
    ),

    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="選擇客戶"
        className="translate-y-[2px]"
      />
    ),

    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // 名稱欄位
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          客戶名稱
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "phone",
    header: "聯絡電話",
  },
  {
    accessorKey: "industry_type",
    header: "行業別",
  },
  {
    accessorKey: "payment_type",
    header: "付款類別",
  },
  {
    accessorKey: "created_at",
    header: "加入時間",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      // 將日期格式化為本地化的 YYYY/MM/DD 格式
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const customer = row.original;
      const { mutate: deleteCustomer, isPending } = useDeleteCustomer();

      return (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打開選單</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/customers/${customer.id}/edit`}
                  className="flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  編輯
                </Link>
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={(e) => e.preventDefault()} // 防止 DropdownMenu 自動關閉
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  刪除
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作無法撤銷。這將永久刪除客戶「{customer.name}
                」及其所有關聯數據（如地址）。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (customer.id) {
                    deleteCustomer(customer.id);
                  }
                }}
                disabled={isPending || !customer.id}
              >
                {isPending ? "刪除中..." : "確定刪除"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];
