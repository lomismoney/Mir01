'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Truck, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { BackorderStatusDialog } from './BackorderStatusDialog';
import { UseBatchSelectionReturn } from '@/hooks/useBatchSelection';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface BackorderGroupedItem {
  order_id: number;
  order_number: string;
  customer_name: string;
  total_items: number;
  total_quantity: number;
  created_at: string;
  days_pending: number;
  summary_status: string;
  summary_status_text: string;
  items: Array<{
    id: number;
    product_name: string;
    sku: string;
    quantity: number;
    integrated_status: string;
    integrated_status_text: string;
    transfer?: {
      id: number;
      status: string;
      from_store_id: number;
      to_store_id: number;
    };
    purchase_item_id?: number;
    purchase_status?: string;
  }>;
}

interface BackorderGroupedListProps {
  data: BackorderGroupedItem[];
  onRefetch?: () => void;
  batchSelection?: UseBatchSelectionReturn;
}

export function BackorderGroupedList({ data, onRefetch, batchSelection }: BackorderGroupedListProps) {
  const [openOrders, setOpenOrders] = useState<number[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const toggleOrder = (orderId: number) => {
    setOpenOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!status) return 'secondary';
    if (status.includes('pending')) return 'destructive';
    if (status.includes('in_progress') || status.includes('in_transit')) return 'default';
    if (status.includes('completed')) return 'outline';
    return 'secondary';
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Package className="h-3 w-3" />;
    if (status.includes('transfer')) return <Truck className="h-3 w-3" />;
    if (status.includes('purchase')) return <ShoppingCart className="h-3 w-3" />;
    return <Package className="h-3 w-3" />;
  };

  return (
    <div className="space-y-2">
      {data.map((order) => {
        const isOpen = openOrders.includes(order.order_id);
        
        return (
          <Collapsible
            key={order.order_id}
            open={isOpen}
            onOpenChange={() => toggleOrder(order.order_id)}
          >
            <div className="rounded-lg border bg-card">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div>
                      <div className="font-medium">{order.order_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.customer_name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-sm">
                      <span className="text-muted-foreground">商品數：</span>
                      <span className="font-medium">{order.total_items}</span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">總數量：</span>
                      <span className="font-medium">{order.total_quantity}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.summary_status)}
                      <Badge variant={getStatusVariant(order.summary_status)}>
                        {order.summary_status_text}
                      </Badge>
                    </div>
                    
                    <div className="text-sm">
                      <span className={Math.floor(Math.abs(order.days_pending)) > 7 ? 'text-destructive' : ''}>
                        {Math.floor(Math.abs(order.days_pending))} 天
                      </span>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {batchSelection && <TableHead className="w-12">選擇</TableHead>}
                        <TableHead>商品名稱</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">數量</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items?.map((item) => {
                        const selectableItem = batchSelection ? {
                          id: item.id,
                          order_id: order.order_id,
                          order_number: order.order_number,
                          product_variant_id: item.product_variant_id || 0,
                          quantity: item.quantity,
                          sku: item.sku,
                          product_name: item.product_name,
                          store_id: 1, // 假設都是門市 1
                        } : null;

                        return (
                          <TableRow key={item.id}>
                            {batchSelection && selectableItem && (
                              <TableCell>
                                <Checkbox
                                  checked={batchSelection.isItemSelected(item.id)}
                                  onCheckedChange={() => batchSelection.toggleItem(selectableItem)}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              {item.product_name}
                            </TableCell>
                            <TableCell>
                              <code className="text-sm">{item.sku}</code>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge 
                                  variant={getStatusVariant(item.integrated_status)}
                                  className="gap-1"
                                >
                                  {getStatusIcon(item.integrated_status)}
                                  {item.integrated_status_text}
                                </Badge>
                                {item.transfer && (
                                  <div className="text-xs text-muted-foreground">
                                    轉移 #{item.transfer.id}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">開啟選單</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>操作</DropdownMenuLabel>
                                  {item.transfer && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          // 需要構建完整的 item 物件給 dialog
                                          const fullItem = {
                                            ...item,
                                            order: {
                                              order_number: order.order_number,
                                              customer: {
                                                name: order.customer_name,
                                              },
                                            },
                                          };
                                          setSelectedItem(fullItem);
                                          setStatusDialogOpen(true);
                                        }}
                                      >
                                        <Truck className="mr-2 h-4 w-4" />
                                        更新轉移狀態
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem>
                                    <Package className="mr-2 h-4 w-4" />
                                    查看商品
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
      
      {selectedItem && (
        <BackorderStatusDialog
          item={selectedItem}
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          onSuccess={() => {
            setSelectedItem(null);
            onRefetch?.();
          }}
        />
      )}
    </div>
  );
}