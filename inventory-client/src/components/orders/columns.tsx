'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { Order } from '@/types/api-helpers';
import { useDeleteOrder } from '@/hooks/queries/useEntityQueries';

// 創建 columns 函數，接受預覽回調
export const createColumns = ({ onPreview }: { onPreview: (id: number) => void }): ColumnDef<Order>[] => [
  // Checkbox 列 (用於批量操作)
  // ...

  {
    accessorKey: 'order_number',
    header: '訂單編號',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <button
          onClick={() => onPreview(order.id)}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {order.order_number}
        </button>
      );
    },
  },
  {
    accessorKey: 'customer.name', // 嵌套數據訪問
    header: '客戶名稱',
  },
  {
    accessorKey: 'shipping_status',
    header: '貨物狀態',
    cell: ({ row }) => {
      const status = row.getValue('shipping_status') as string;
      // 根據不同狀態給予不同顏色的徽章
      const variant: "default" | "secondary" | "destructive" | "outline" = 
        status === 'delivered' ? 'default' :
        status === 'shipped' ? 'secondary' :
        status === 'processing' ? 'outline' :
        status === 'pending' ? 'outline' : 'destructive';
      
      const statusText = {
        'pending': '待處理',
        'processing': '處理中',
        'shipped': '已出貨',
        'delivered': '已完成'
      }[status] || status;
      
      return <Badge variant={variant}>{statusText}</Badge>;
    }
  },
  {
    accessorKey: 'payment_status',
    header: '付款狀態',
    cell: ({ row }) => {
      const status = row.getValue('payment_status') as string;
      const variant: "default" | "secondary" | "destructive" | "outline" = 
        status === 'paid' ? 'default' :
        status === 'partial' ? 'secondary' :
        status === 'pending' ? 'outline' : 'destructive';
      
      const statusText = {
        'pending': '待付款',
        'partial': '部分付款',
        'paid': '已付款',
        'refunded': '已退款'
      }[status] || status;
      
      return <Badge variant={variant}>{statusText}</Badge>;
    }
  },
  {
    accessorKey: 'grand_total',
    header: '訂單總額',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grand_total'));
      const formatted = new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'created_at',
    header: '下單時間',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'));
      return <span>{date.toLocaleString('zh-TW')}</span>;
    },
  },
  // 操作列
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => {
      const order = row.original;
      const { mutate: deleteOrder, isPending } = useDeleteOrder(); // <-- 使用新 Hook

      return (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}`}>查看完整詳情</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                {/* 我們將在下一步創建 /edit 頁面 */}
                <Link href={`/orders/${order.id}/edit`}>編輯</Link>
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={(e) => e.preventDefault()} // 防止 DropdownMenu 立即關閉
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  刪除
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要刪除此訂單嗎？</AlertDialogTitle>
              <AlertDialogDescription>
                此操作無法撤銷。這將永久刪除訂單「{order.order_number}」。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteOrder(order.id)}
                disabled={isPending}
              >
                {isPending ? '刪除中...' : '確定刪除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  }
]; 