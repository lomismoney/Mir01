"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Eye,
  FileText,
  UserCheck,
  Play,
  CheckCircle,
  Pause,
  Ban,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
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
import Link from "next/link";
import { 
  InstallationWithRelations, 
  InstallationStatus 
} from "@/types/installation";
import { useDeleteInstallation } from "@/hooks";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { formatDate } from "@/lib/dateHelpers";
import { InstallationProgressTracker } from "./InstallationProgressTracker";

/**
 * 創建安裝管理表格欄位定義
 * 
 * @param callbacks - 操作回調函數集合
 * @returns 表格欄位定義陣列
 */
export const createInstallationColumns = ({
  onPreview,
  onAssignInstaller,
  onUpdateStatus,
  onEdit,
  onDelete,
}: {
  onPreview: (id: number) => void;
  onAssignInstaller: (installation: InstallationWithRelations) => void;
  onUpdateStatus: (installation: InstallationWithRelations, status: InstallationStatus) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}): ColumnDef<InstallationWithRelations>[] => [
  // 選擇欄
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
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="選擇安裝單"
          className="translate-y-[2px]"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
    maxSize: 40,
  },

  // 安裝單號欄
  {
    accessorKey: "installation_number",
    header: "安裝單號",
    cell: ({ row }) => {
      const installation = row.original;
      return (
        <div className="py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPreview(installation.id)}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline transition-colors duration-200 font-mono bg-accent/20 px-2 py-1 rounded-md hover:bg-accent/40"
            >
              {installation.installation_number}
            </button>
            {/* 如果有關聯訂單，顯示連結圖示 */}
            {installation.order_id && (
              <Link 
                href={`/orders/${installation.order_id}`}
                className="text-muted-foreground hover:text-primary transition-colors duration-200 p-1 hover:bg-accent/30 rounded"
                title="查看關聯訂單"
              >
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-1">
            建立於 {formatDate.shortDateTime(installation.created_at)}
          </div>
        </div>
      );
    },
  },

  // 預計安裝日期欄
  {
    accessorKey: "scheduled_date",
    header: () => <div className="text-center">預計安裝日期</div>,
    size: 140,
    cell: ({ row }) => {
      const installation = row.original;
      const scheduledDate = installation.scheduled_date;
      return (
        <div className="py-2 text-center">
          {scheduledDate ? (
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">
                {formatDate.monthDay(scheduledDate)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate.weekday(scheduledDate)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic bg-muted/30 px-2 py-1 rounded-md">
              未安排
            </div>
          )}
        </div>
      );
    },
  },

  // 客戶姓名欄
  {
    accessorKey: "customer_name",
    header: "客戶姓名",
    cell: ({ row }) => {
      const installation = row.original;
      const customerName = installation.customer_name || "-";
      const customerPhone = installation.customer_phone;
      return (
        <div className="py-2">
          <div className="max-w-[150px] truncate text-sm font-medium" title={customerName}>
            {customerName}
          </div>
          {customerPhone && (
            <div className="text-xs text-muted-foreground font-mono mt-1 bg-muted/20 px-2 py-0.5 rounded w-fit">
              {customerPhone}
            </div>
          )}
        </div>
      );
    },
  },

  // 安裝地址欄
  {
    accessorKey: "installation_address",
    header: "安裝地址",
    cell: ({ row }) => {
      const address = row.original.installation_address;
      return (
        <div className="py-2">
          <div className="max-w-[200px] text-sm leading-relaxed bg-muted/10 p-2 rounded-md border-l-2 border-muted" title={address}>
            <div className="line-clamp-2">
              {address}
            </div>
          </div>
        </div>
      );
    },
  },

  // 安裝師傅欄
  {
    accessorKey: "installer.name",
    header: "安裝師傅",
    cell: ({ row }) => {
      const installer = row.original.installer;
      return (
        <div className="py-2">
          {installer ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {(installer.name || installer.username || '師').charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium">
                  {installer.name || installer.username || `用戶 ${installer.id}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  @{installer.username}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center">
                <span className="text-xs">?</span>
              </div>
              <span className="text-sm italic">未分配</span>
            </div>
          )}
        </div>
      );
    },
  },



  // 操作欄
  {
    id: "actions",
    size: 80,
    header: () => <div className="text-right">操作</div>,
    cell: ({ row }) => {
      const installation = row.original;
      const { mutate: deleteInstallation, isPending } = useDeleteInstallation();

      // 權限判斷邏輯
      const canAssignInstaller = installation.status === 'pending';
      const canStart = installation.status === 'scheduled' && installation.installer_user_id;
      const canComplete = installation.status === 'in_progress';
      const canCancel = ['pending', 'scheduled'].includes(installation.status);
      const canEdit = installation.status !== 'completed' && installation.status !== 'cancelled';

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">開啟選單</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>

              {/* 檢視分組 */}
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => onPreview(installation.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>快速預覽</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/installations/${installation.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>查看完整詳情</span>
                  </Link>
                </DropdownMenuItem>
                {installation.order_id && (
                  <DropdownMenuItem asChild>
                    <Link href={`/orders/${installation.order_id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>查看關聯訂單</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* 核心流程分組 */}
              <DropdownMenuGroup>
                {canAssignInstaller && (
                  <DropdownMenuItem 
                    onSelect={() => onAssignInstaller(installation)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>分配師傅</span>
                  </DropdownMenuItem>
                )}
                {canStart && (
                  <DropdownMenuItem 
                    onSelect={() => onUpdateStatus(installation, 'in_progress')}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    <span>開始安裝</span>
                  </DropdownMenuItem>
                )}
                {canComplete && (
                  <DropdownMenuItem 
                    onSelect={() => onUpdateStatus(installation, 'completed')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>完成安裝</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* 逆向流程分組 */}
              <DropdownMenuGroup>
                {installation.status === 'in_progress' && (
                  <DropdownMenuItem 
                    onSelect={() => onUpdateStatus(installation, 'scheduled')}
                  >
                    <Pause className="mr-2 h-4 w-4 text-amber-600" />
                    <span className="text-amber-600">暫停安裝</span>
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem 
                    onSelect={() => onUpdateStatus(installation, 'cancelled')}
                  >
                    <Ban className="mr-2 h-4 w-4 text-destructive" />
                    <span className="text-destructive">取消安裝</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* 編輯與刪除分組 */}
              <DropdownMenuGroup>
                {canEdit && (
                  <DropdownMenuItem onSelect={() => onEdit(installation.id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>編輯</span>
                  </DropdownMenuItem>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>刪除</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確定要刪除此安裝單嗎？</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作無法撤銷。這將永久刪除安裝單「{installation.installation_number}」。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteInstallation(installation.id)}
                        disabled={isPending}
                      >
                        {isPending ? "刪除中..." : "確定刪除"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
]; 