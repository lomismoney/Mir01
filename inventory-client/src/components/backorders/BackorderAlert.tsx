'use client';

import { useBackorderStats } from '@/hooks/queries/backorders/useBackorders';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function BackorderAlert() {
  const { data: stats, isLoading } = useBackorderStats();

  // 如果沒有待處理的預訂商品，不顯示警示
  if (isLoading || !stats?.data || stats.data.total_items === 0) {
    return null;
  }

  const { total_items, unique_products, days_pending } = stats.data;
  
  // 根據等待天數決定警示等級
  const isUrgent = (days_pending || 0) > 3;
  const variant = isUrgent ? 'destructive' : 'default';

  return (
    <Alert variant={variant} className="relative">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>待進貨商品提醒</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm">
              您有 <span className="font-semibold">{total_items}</span> 項待進貨商品
              （共 <span className="font-semibold">{unique_products}</span> 種）尚未建立進貨單。
              {(days_pending || 0) > 0 && (
                <>
                  最早的預訂已等待 <span className="font-semibold">{days_pending || 0}</span> 天。
                </>
              )}
            </p>
          </div>
          <Link href="/orders/backorders">
            <Button variant={isUrgent ? 'default' : 'outline'} size="sm">
              立即處理
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}