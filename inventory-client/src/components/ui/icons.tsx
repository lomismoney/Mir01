// 圖標管理系統 - 使用動態導入優化性能
// 這個文件提供向後兼容性，同時引導使用新的 DynamicIcon 系統

import { DynamicIcon, type IconName } from './DynamicIcon';

// 導出新的動態圖標系統
export { DynamicIcon, type IconName };
export {
  Icon,
  LoadingIcon,
  CheckIcon,
  CloseIcon,
  AddIcon,
  SearchIcon,
  AlertIcon,
} from './DynamicIcon';

// 為了向後兼容，提供常用圖標的直接導出
// 注意：建議逐步遷移到 DynamicIcon 系統
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  File,
  FileText,
  HelpCircle,
  Image,
  Laptop,
  Loader2,
  Moon,
  MoreVertical,
  Plus,
  Search,
  Settings,
  SunMedium,
  Trash,
  User,
  X,
  AlertTriangle,
  FileDown,
  FileUp,
  Warehouse,
  Package,
  Truck,
  Box,
  Pencil,
  Save,
  RotateCw as RefreshIcon,
  Minus as MinusIcon,
  Eye,
  PlusCircle,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Filter,
} from "lucide-react";

// 保持向後兼容的導出
export {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  File,
  FileText,
  HelpCircle,
  Image,
  Laptop,
  Loader2,
  Moon,
  MoreVertical,
  Plus,
  Search,
  Settings,
  SunMedium,
  Trash,
  User,
  X,
  AlertTriangle,
  FileDown,
  FileUp,
  Warehouse,
  Package,
  Truck,
  Box,
  RefreshIcon,
  MinusIcon,
  Pencil,
  Save,
  Eye,
  PlusCircle,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Filter,
};

// 便捷的包裝器函數，用於快速遷移
export const createIconComponent = (name: IconName) => {
  const IconComponent = (props: React.ComponentProps<typeof DynamicIcon>) => (
    <DynamicIcon name={name} {...props} />
  );
  IconComponent.displayName = `IconComponent(${name})`;
  return IconComponent;
};

// 常用圖標的便捷組件
export const EditIcon = createIconComponent('Edit');
export const TrashIcon = createIconComponent('Trash2');
export const SaveIcon = createIconComponent('Save');
export const EyeIcon = createIconComponent('Eye');
export const PackageIcon = createIconComponent('Package');
export const UserIcon = createIconComponent('User');
export const SettingsIcon = createIconComponent('Settings');
