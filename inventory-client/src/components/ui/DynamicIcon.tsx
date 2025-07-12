import React, { ComponentType, lazy, Suspense } from 'react';
import { LucideProps } from 'lucide-react';

// 常用圖標的直接導入（立即加載）
import {
  Loader2,
  Check,
  X,
  Plus,
  Search,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

// 圖標名稱映射表
type IconName = 
  // 常用圖標（立即加載）
  | 'Loader2' | 'Check' | 'X' | 'Plus' | 'Search' | 'AlertCircle'
  | 'ChevronDown' | 'ChevronLeft' | 'ChevronRight' | 'MoreHorizontal'
  // 業務圖標（懶加載）
  | 'Edit' | 'Trash' | 'Trash2' | 'Save' | 'Eye' | 'EyeOff'
  | 'Package' | 'Box' | 'Truck' | 'Warehouse' | 'Store'
  | 'User' | 'Users' | 'Settings' | 'Calendar' | 'Clock'
  | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'
  | 'TrendingUp' | 'TrendingDown' | 'RefreshCw' | 'RotateCw'
  | 'File' | 'FileText' | 'FileDown' | 'FileUp' | 'Image'
  | 'PlusCircle' | 'CheckCircle' | 'XCircle' | 'AlertTriangle'
  | 'Building2' | 'MapPin' | 'DollarSign' | 'CreditCard'
  | 'Filter' | 'SortAsc' | 'SortDesc' | 'Grid3X3' | 'List'
  | 'Moon' | 'SunMedium' | 'Monitor' | 'Laptop' | 'Smartphone'
  | 'Download' | 'Upload' | 'ExternalLink' | 'Link' | 'Copy'
  | 'Star' | 'Heart' | 'Bookmark' | 'Tag' | 'Flag'
  | 'Bell' | 'Mail' | 'Phone' | 'MessageSquare' | 'Send'
  | 'Home' | 'Menu' | 'MoreVertical' | 'Maximize' | 'Minimize'
  | 'Info' | 'HelpCircle' | 'Shield' | 'Lock' | 'Unlock'
  | 'ChevronsUpDown' | 'ChevronsLeft' | 'ChevronsRight'
  | 'GripVertical' | 'Move' | 'Resize' | 'ExpandIcon' | 'ShrinkIcon';

// 常用圖標映射（立即加載）
const immediateIcons: Record<string, ComponentType<LucideProps>> = {
  Loader2,
  Check,
  X,
  Plus,
  Search,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
};

// 懶加載圖標的工廠函數
const createLazyIcon = (iconName: string) =>
  lazy(() =>
    import('lucide-react').then((module) => ({
      default: module[iconName as keyof typeof module] as ComponentType<LucideProps>,
    }))
  );

// 懶加載圖標緩存
const lazyIconCache: Record<string, ComponentType<LucideProps>> = {};

// 獲取懶加載圖標
const getLazyIcon = (iconName: string): ComponentType<LucideProps> => {
  if (!lazyIconCache[iconName]) {
    lazyIconCache[iconName] = createLazyIcon(iconName);
  }
  return lazyIconCache[iconName];
};

interface DynamicIconProps extends LucideProps {
  name: IconName;
  fallback?: ComponentType<LucideProps>;
}

/**
 * 動態圖標組件
 * 
 * 特性：
 * 1. 常用圖標立即加載，提供最佳性能
 * 2. 業務圖標懶加載，減少初始 bundle 大小
 * 3. 統一的圖標管理，避免重複導入
 * 4. 支持 fallback 圖標
 * 5. 完整的 TypeScript 支持
 */
export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  fallback: FallbackIcon = Loader2,
  ...props
}) => {
  // 如果是常用圖標，直接渲染
  if (immediateIcons[name]) {
    const IconComponent = immediateIcons[name];
    return <IconComponent {...props} />;
  }

  // 懶加載圖標
  const LazyIcon = getLazyIcon(name);

  return (
    <Suspense fallback={<FallbackIcon {...props} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
};

export type { IconName };

// 便捷的圖標組件導出
export const Icon = DynamicIcon;

// 預設的圖標組合
export const LoadingIcon = () => <DynamicIcon name="Loader2" className="animate-spin" />;
export const CheckIcon = () => <DynamicIcon name="Check" />;
export const CloseIcon = () => <DynamicIcon name="X" />;
export const AddIcon = () => <DynamicIcon name="Plus" />;
export const SearchIcon = () => <DynamicIcon name="Search" />;
export const AlertIcon = () => <DynamicIcon name="AlertCircle" />;