"use client";

import React from 'react';
import { Lock } from 'lucide-react';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';

interface EmptyPermissionProps {
  title?: string;
  description?: string;
  contactEmail?: string;
  onContactAdmin?: () => void;
  className?: string;
}

/**
 * 權限不足空狀態組件
 * 用於顯示用戶無權訪問某些功能或資源時的狀態
 */
export const EmptyPermission: React.FC<EmptyPermissionProps> = ({
  title = '權限不足',
  description = '您沒有權限訪問此功能',
  contactEmail = 'admin@example.com',
  onContactAdmin,
  className,
}) => {
  return (
    <div className={cn("py-12", className)}>
      <EmptyState
        icon={Lock}
        title={title}
        description={description}
        action={
          onContactAdmin
            ? {
                label: '聯繫管理員',
                onClick: onContactAdmin,
                variant: 'default',
              }
            : contactEmail
            ? {
                label: '聯繫管理員',
                onClick: () => window.location.href = `mailto:${contactEmail}`,
                variant: 'default',
              }
            : undefined
        }
      >
        <div className="mt-4 text-sm text-muted-foreground">
          <p>如需獲得訪問權限，請：</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>聯繫您的系統管理員</li>
            <li>確認您的帳戶權限設定</li>
            <li>檢查您是否已登入正確的帳戶</li>
          </ul>
        </div>
      </EmptyState>
    </div>
  );
};