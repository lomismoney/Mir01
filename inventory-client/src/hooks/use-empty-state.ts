import { useRouter } from 'next/navigation';
import { emptyStateConfig, moduleIcons, searchSuggestions } from '@/components/ui/empty-state/config';
import type { EmptyStateConfig } from '@/components/ui/empty-state/types';

/**
 * 統一的空狀態配置 Hook
 * 提供各模塊的空狀態配置和導航功能
 */
export function useEmptyState(module: keyof EmptyStateConfig) {
  const router = useRouter();
  const config = emptyStateConfig[module];
  const Icon = moduleIcons[module];
  const suggestions = searchSuggestions[module] || searchSuggestions.default;

  const handleAction = () => {
    router.push(config.actionRoute);
  };

  return {
    config,
    Icon,
    suggestions,
    handleAction,
  };
}