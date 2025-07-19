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
  // 選擇欄 - 現代化設計
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="全選"
          className="rounded border-border/60 hover:border-primary/60 transition-colors duration-200"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="選擇安裝單"
          className="rounded border-border/60 hover:border-primary/60 transition-colors duration-200"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
    maxSize: 50,
  },

  // 安裝單號欄 - 現代化設計
  {
    accessorKey: "installation_number",
    header: () => (
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        安裝單號
      </div>
    ),
    cell: ({ row }) => {
      const installation = row.original;
      return (
        <div className="py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPreview(installation.id)}
              className="group flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-all duration-200 font-mono bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 rounded-lg hover:from-primary/15 hover:to-primary/10 border border-primary/20 hover:border-primary/30"
            >
              <svg className="h-3 w-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {installation.installation_number}
            </button>
            
            {/* 如果有關聯訂單，顯示連結圖示 */}
            {installation.order_id && (
              <Link 
                href={`/orders/${installation.order_id}`}
                className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-primary transition-all duration-200 hover:bg-accent/50 rounded-lg border border-transparent hover:border-border/50"
                title="查看關聯訂單"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            建立於 {formatDate.shortDateTime(installation.created_at)}
          </div>
        </div>
      );
    },
    size: 220,
  },

  // 預計安裝日期欄 - 現代化設計
  {
    accessorKey: "scheduled_date",
    header: () => (
      <div className="flex items-center justify-center gap-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        預計安裝日期
      </div>
    ),
    size: 160,
    cell: ({ row }) => {
      const installation = row.original;
      const scheduledDate = installation.scheduled_date;
      const today = new Date();
      const dateObj = scheduledDate ? new Date(scheduledDate) : null;
      const isToday = dateObj && dateObj.toDateString() === today.toDateString();
      const isOverdue = dateObj && dateObj < today && !isToday;
      const isUpcoming = dateObj && dateObj > today;
      
      return (
        <div className="py-3 flex justify-center">
          {scheduledDate ? (
            <div className={`
              flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-200
              ${isToday ? 'bg-orange-50 border-orange-200 text-orange-800 shadow-sm' : ''}
              ${isOverdue ? 'bg-red-50 border-red-200 text-red-800' : ''}
              ${isUpcoming ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
              ${!isToday && !isOverdue && !isUpcoming ? 'bg-muted/20 border-border/30' : ''}
            `}>
              <div className="text-sm font-semibold">
                {formatDate.monthDay(scheduledDate)}
              </div>
              <div className="text-xs font-medium">
                {formatDate.weekday(scheduledDate)}
              </div>
              {isToday && (
                <div className="text-xs font-medium px-1.5 py-0.5 bg-orange-100 rounded-full">
                  今天
                </div>
              )}
              {isOverdue && (
                <div className="text-xs font-medium px-1.5 py-0.5 bg-red-100 rounded-full">
                  逾期
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-dashed border-border/50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              未安排
            </div>
          )}
        </div>
      );
    },
  },

  // 客戶資訊欄 - 現代化設計
  {
    accessorKey: "customer_name",
    header: () => (
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        客戶資訊
      </div>
    ),
    cell: ({ row }) => {
      const installation = row.original;
      const customerName = installation.customer_name || "-";
      const customerPhone = installation.customer_phone;
      return (
        <div className="py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-sm">
              <span className="text-sm font-semibold">
                {customerName.charAt(0)?.toUpperCase() || 'C'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate" title={customerName}>
                {customerName}
              </div>
              {customerPhone && (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md">
                    {customerPhone}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    },
    size: 180,
  },

  // 安裝地址欄 - 現代化設計
  {
    accessorKey: "installation_address",
    header: () => (
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        安裝地址
      </div>
    ),
    cell: ({ row }) => {
      const address = row.original.installation_address;
      return (
        <div className="py-3">
          <div className="max-w-[250px] text-sm leading-relaxed bg-gradient-to-r from-muted/20 to-muted/10 p-3 rounded-lg border border-border/30 hover:border-border/50 transition-all duration-200" title={address}>
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div className="line-clamp-3 text-foreground/90">
                {address}
              </div>
            </div>
          </div>
        </div>
      );
    },
    size: 280,
  },

  // 安裝師傅欄 - 現代化設計
  {
    accessorKey: "installer.name",
    header: () => (
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        安裝師傅
      </div>
    ),
    cell: ({ row }) => {
      const installer = row.original.installer;
      return (
        <div className="py-3">
          {installer ? (
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-green-25 p-3 rounded-lg border border-green-200 hover:border-green-300 transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-sm">
                <span className="text-sm font-semibold">
                  {(installer.name || installer.username || '師').charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-green-800">
                  {installer.name || installer.username || `用戶 ${installer.id}`}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs text-green-600 font-medium">
                    @{installer.username}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-lg border border-dashed border-border/50">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm text-muted-foreground font-medium">未分配師傅</span>
            </div>
          )}
        </div>
      );
    },
    size: 200,
  },



  // 操作欄 - 現代化設計
  {
    id: "actions",
    size: 100,
    header: () => (
      <div className="flex items-center justify-center gap-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        操作
      </div>
    ),
    cell: ({ row }) => {
      const installation = row.original;

      // 權限判斷邏輯
      const canAssignInstaller = installation.status === 'pending';
      const canStart = installation.status === 'scheduled' && installation.installer_user_id;
      const canComplete = installation.status === 'in_progress';
      const canCancel = ['pending', 'scheduled'].includes(installation.status);
      const canEdit = installation.status !== 'completed' && installation.status !== 'cancelled';

      return (
        <div className="flex justify-center py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-9 w-9 p-0 rounded-lg hover:bg-accent/50 border border-transparent hover:border-border/50 transition-all duration-200 hover:shadow-sm"
              >
                <span className="sr-only">開啟選單</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-xl">
              <DropdownMenuLabel className="flex items-center gap-2 font-semibold">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                快速操作
              </DropdownMenuLabel>

              {/* 檢視分組 */}
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => onPreview(installation.id)} className="flex items-center gap-3 py-2">
                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                    <Eye className="h-3 w-3 text-blue-600" />
                  </div>
                  <span>快速預覽</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => window.location.href = `/installations/${installation.id}`}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                    <FileText className="h-3 w-3 text-purple-600" />
                  </div>
                  <span>查看完整詳情</span>
                </DropdownMenuItem>
                {installation.order_id && (
                  <DropdownMenuItem
                    onSelect={() => window.location.href = `/orders/${installation.order_id}`}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center">
                      <ExternalLink className="h-3 w-3 text-indigo-600" />
                    </div>
                    <span>查看關聯訂單</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* 核心流程分組 */}
              <DropdownMenuGroup>
                {canAssignInstaller && (
                  <DropdownMenuItem 
                    onSelect={() => onAssignInstaller(installation)}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                      <UserCheck className="h-3 w-3 text-green-600" />
                    </div>
                    <span>分配師傅</span>
                  </DropdownMenuItem>
                )}
                {canStart && (
                  <DropdownMenuItem 
                    onSelect={() => onUpdateStatus(installation, 'in_progress')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center">
                      <Play className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span>開始安裝</span>
                  </DropdownMenuItem>
                )}
                {canComplete && (
                  <DropdownMenuItem 
                    onSelect={() => onUpdateStatus(installation, 'completed')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
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
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                      <Pause className="h-3 w-3 text-amber-600" />
                    </div>
                    <span className="text-amber-600 font-medium">暫停安裝</span>
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <DropdownMenuItem 
                    onSelect={() => onUpdateStatus(installation, 'cancelled')}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center">
                      <Ban className="h-3 w-3 text-red-600" />
                    </div>
                    <span className="text-red-600 font-medium">取消安裝</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* 編輯與刪除分組 */}
              <DropdownMenuGroup>
                {canEdit && (
                  <DropdownMenuItem 
                    onSelect={() => onEdit(installation.id)}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <Pencil className="h-3 w-3 text-blue-600" />
                    </div>
                    <span>編輯安裝單</span>
                  </DropdownMenuItem>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="flex items-center gap-3 py-2 text-red-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center">
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </div>
                      <span className="font-medium">刪除安裝單</span>
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
                        onClick={() => onDelete(installation.id)}
                      >
                        確定刪除
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