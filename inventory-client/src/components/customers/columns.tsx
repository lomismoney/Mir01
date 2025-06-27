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
        data-oid="jsfok30"
      />
    ),

    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="選擇客戶"
        className="translate-y-[2px]"
        data-oid="ql19t8z"
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
          data-oid="5m4n9-e"
        >
          客戶名稱
          <ArrowUpDown className="ml-2 h-4 w-4" data-oid="tgq0y6c" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium" data-oid="o5pdi:b">
        {row.getValue("name")}
      </div>
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
      return <span data-oid="fip8_60">{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const customer = row.original;
      const { mutate: deleteCustomer, isPending } = useDeleteCustomer();

      return (
        <AlertDialog data-oid="bnasneb">
          <DropdownMenu data-oid="2o.ku8f">
            <DropdownMenuTrigger asChild data-oid="_htz5__">
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                data-oid="0dgpih2"
              >
                <span className="sr-only" data-oid="u9aifap">
                  打開選單
                </span>
                <MoreHorizontal className="h-4 w-4" data-oid="7eubhew" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-oid="xmi_:5l">
              <DropdownMenuItem asChild data-oid="134k:9v">
                <Link
                  href={`/customers/${customer.id}/edit`}
                  className="flex items-center"
                  data-oid="l5h5uja"
                >
                  <Edit className="mr-2 h-4 w-4" data-oid="j66lb4m" />
                  編輯
                </Link>
              </DropdownMenuItem>
              <AlertDialogTrigger asChild data-oid="dpctrga">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()} // 防止 DropdownMenu 自動關閉
                  data-oid="e.6uwvo"
                >
                  <Trash2 className="mr-2 h-4 w-4" data-oid="0p4aha6" />
                  刪除
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent data-oid=".5yi38h">
            <AlertDialogHeader data-oid="w7.zz:d">
              <AlertDialogTitle data-oid="p.wzc4b">
                確定要刪除嗎？
              </AlertDialogTitle>
              <AlertDialogDescription data-oid="nt5snhs">
                此操作無法撤銷。這將永久刪除客戶「{customer.name}
                」及其所有關聯數據（如地址）。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter data-oid="yzxydcc">
              <AlertDialogCancel data-oid="1pw4ij3">取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (customer.id) {
                    deleteCustomer(customer.id);
                  }
                }}
                disabled={isPending || !customer.id}
                data-oid="pg0kj0_"
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
