"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Customer } from "@/types/api-helpers";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Building2, 
  CreditCard, 
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { useDeleteCustomer } from "@/hooks";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

// 🎯 【Task 3】columns 函數參數類型定義
interface ColumnsProps {
  onEditCustomer: (customer: Customer) => void;
}

// 🎯 【Task 3】將 columns 改為函數，接收編輯回調
export const columns = (props: ColumnsProps): ColumnDef<Customer>[] => [
  // 選擇欄位
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
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
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="選擇客戶"
          className="translate-y-[2px]"
          data-oid="ql19t8z"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // 客戶名稱欄位 - 美化設計
  {
    accessorKey: "name",
    header: ({ column }) => {
      const sortDirection = column.getIsSorted();
      
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
            <User className="h-3 w-3 text-primary" />
          </div>
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors"
          >
            客戶名稱
            <div className="ml-2 flex items-center">
              {sortDirection === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-primary" />
              ) : sortDirection === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
              )}
            </div>
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const customer = row.original;
      const customerName = row.getValue("name") as string;
      const initial = customerName ? customerName.charAt(0) : "?";
      
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-foreground">{customerName}</span>
              {customer.is_company && (
                <Badge variant="secondary" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  公司
                </Badge>
              )}
            </div>
            {customer.tax_id && (
              <span className="text-xs text-muted-foreground">統編: {customer.tax_id}</span>
            )}
          </div>
        </div>
      );
    },
  },

  // 聯絡電話欄位
  {
    accessorKey: "phone",
    header: () => (
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted">
          <Phone className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="font-semibold text-foreground">聯絡電話</span>
      </div>
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return (
        <div className="space-y-1">
          {phone ? (
            <>
              <div className="text-sm font-medium">{phone}</div>
                             <div className="flex items-center space-x-1">
                 <div className="h-2 w-2 rounded-full bg-success"></div>
                 <span className="text-xs text-muted-foreground">已設定電話</span>
               </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-muted"></div>
              <span className="text-sm text-muted-foreground">未設定電話</span>
            </div>
          )}
        </div>
      );
    },
  },

  // 行業別欄位
  {
    accessorKey: "industry_type",
    header: () => (
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted">
          <Building2 className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="font-semibold text-foreground">行業別</span>
      </div>
    ),
    cell: ({ row }) => {
      const industryType = row.getValue("industry_type") as string;
      const getIndustryColor = (type: string) => {
        switch (type) {
          case "設計師":
            return "bg-info/10 text-info border-info/20";
          case "建設公司":
            return "bg-warning/10 text-warning border-warning/20";
          case "統包工程商":
            return "bg-success/10 text-success border-success/20";
          default:
            return "bg-muted text-muted-foreground";
        }
      };
      
      return (
        <Badge variant="outline" className={`${getIndustryColor(industryType)} font-medium`}>
          {industryType}
        </Badge>
      );
    },
  },

  // 付款類別欄位
  {
    accessorKey: "payment_type",
    header: () => (
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted">
          <CreditCard className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="font-semibold text-foreground">付款類別</span>
      </div>
    ),
    cell: ({ row }) => {
      const paymentType = row.getValue("payment_type") as string;
      const isCredit = paymentType === "月結客戶";
      
             return (
         <div className="flex items-center space-x-2">
           <div className={`h-2 w-2 rounded-full ${isCredit ? 'bg-warning' : 'bg-success'}`}></div>
           <span className="text-sm">{paymentType}</span>
         </div>
       );
    },
  },

  // 加入時間欄位
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      const sortDirection = column.getIsSorted();
      
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted">
            <Calendar className="h-3 w-3 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors"
          >
            加入時間
            <div className="ml-2 flex items-center">
              {sortDirection === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-primary" />
              ) : sortDirection === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
              )}
            </div>
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const dateString = row.getValue("created_at") as string;
      if (!dateString) {
        return (
          <div className="text-muted-foreground">
            -
          </div>
        );
      }

      try {
        const date = new Date(dateString);
        const formattedDate = format(date, "yyyy-MM-dd", { locale: zhTW });
        const timeAgo = format(date, "MM月dd日", { locale: zhTW });
        
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">{formattedDate}</div>
            <div className="text-xs text-muted-foreground">{timeAgo}</div>
          </div>
        );
      } catch {
        return (
          <div className="text-muted-foreground">
            格式錯誤
          </div>
        );
      }
    },
  },

  // 操作欄位
  {
    id: "actions",
    header: () => (
      <div className="flex items-center justify-center">
        <span className="font-semibold text-foreground">操作</span>
      </div>
    ),
    cell: ({ row }) => {
      const customer = row.original;
      const { mutate: deleteCustomer } = useDeleteCustomer();

      return (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                <span className="sr-only">開啟選單</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => props.onEditCustomer(customer)}
                className="cursor-pointer"
                data-testid={`edit-customer-${customer.id}`}
              >
                <Edit className="mr-2 h-4 w-4" />
                編輯客戶
              </DropdownMenuItem>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    刪除客戶
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>確認刪除客戶？</AlertDialogTitle>
                    <AlertDialogDescription>
                      您即將刪除客戶「{customer.name}」。此操作將會移除該客戶的所有相關訂單紀錄，且無法復原。請確認是否要繼續？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCustomer(customer.id!)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      確認刪除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
