/**
 * 圖標優化工具
 * 
 * 提供圖標使用分析、建議和批量替換功能
 */

// 圖標分類
export const ICON_CATEGORIES = {
  // 高頻使用圖標（建議立即加載）
  CRITICAL: [
    'Loader2', 'Check', 'X', 'Plus', 'Search', 'AlertCircle',
    'ChevronDown', 'ChevronLeft', 'ChevronRight', 'MoreHorizontal'
  ],
  
  // 業務核心圖標（建議預加載）
  BUSINESS: [
    'Package', 'Truck', 'Warehouse', 'DollarSign', 'CreditCard',
    'Users', 'User', 'ShoppingCart', 'Edit', 'Trash2'
  ],
  
  // UI 控制圖標（按需加載）
  UI_CONTROLS: [
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'ChevronUp', 'ChevronsUpDown', 'ExpandIcon', 'ShrinkIcon',
    'Maximize', 'Minimize', 'Menu', 'MoreVertical'
  ],
  
  // 狀態圖標（按需加載）
  STATUS: [
    'CheckCircle', 'XCircle', 'AlertTriangle', 'Info',
    'TrendingUp', 'TrendingDown', 'RefreshCw', 'RotateCw'
  ],
  
  // 功能圖標（按需加載）
  FEATURES: [
    'Eye', 'EyeOff', 'Save', 'Download', 'Upload', 'Copy',
    'ExternalLink', 'Link', 'Share', 'Print', 'Filter'
  ]
} as const;

type IconCategory = keyof typeof ICON_CATEGORIES;

// 圖標替換建議
export const ICON_REPLACEMENTS = {
  // 統一類似圖標
  'Trash': 'Trash2',
  'RotateCw': 'RefreshCw',
  'Sun': 'SunMedium',
  'ChevronDownIcon': 'ChevronDown',
  'CheckIcon': 'Check',
  'XIcon': 'X',
  
  // 語義化替換
  'CircleIcon': 'Circle',
  'SearchIcon': 'Search',
  'PanelLeftIcon': 'PanelLeft',
} as const;

/**
 * 分析圖標使用模式
 */
export function analyzeIconUsage(icons: string[]): {
  byCategory: Record<IconCategory, string[]>;
  recommendations: {
    toImmediate: string[];
    toPreload: string[];
    toLazy: string[];
  };
  replacements: Array<{ from: string; to: string; reason: string }>;
} {
  const byCategory: Record<IconCategory, string[]> = {
    CRITICAL: [],
    BUSINESS: [],
    UI_CONTROLS: [],
    STATUS: [],
    FEATURES: []
  };

  // 按類別分類圖標
  for (const icon of icons) {
    let categorized = false;
    
    for (const [category, categoryIcons] of Object.entries(ICON_CATEGORIES)) {
      if ((categoryIcons as unknown as string[]).includes(icon)) {
        byCategory[category as IconCategory].push(icon);
        categorized = true;
        break;
      }
    }
    
    // 如果沒有分類，歸類為功能圖標
    if (!categorized) {
      byCategory.FEATURES.push(icon);
    }
  }

  // 生成優化建議
  const recommendations = {
    toImmediate: [...byCategory.CRITICAL],
    toPreload: [...byCategory.BUSINESS, ...byCategory.STATUS],
    toLazy: [...byCategory.UI_CONTROLS, ...byCategory.FEATURES]
  };

  // 生成替換建議
  const replacements: Array<{ from: string; to: string; reason: string }> = [];
  for (const icon of icons) {
    if (icon in ICON_REPLACEMENTS) {
      const replacement = ICON_REPLACEMENTS[icon as keyof typeof ICON_REPLACEMENTS];
      replacements.push({
        from: icon,
        to: replacement,
        reason: '統一圖標命名規範'
      });
    }
  }

  return {
    byCategory,
    recommendations,
    replacements
  };
}

/**
 * 生成圖標優化報告
 */
export function generateOptimizationReport(icons: string[]): string {
  const analysis = analyzeIconUsage(icons);
  const totalIcons = icons.length;
  const uniqueIcons = new Set(icons).size;
  
  let report = `# 圖標使用優化報告\n\n`;
  
  report += `## 統計概覽\n`;
  report += `- 總圖標使用次數: ${totalIcons}\n`;
  report += `- 唯一圖標數量: ${uniqueIcons}\n`;
  report += `- 重複使用率: ${((totalIcons - uniqueIcons) / totalIcons * 100).toFixed(1)}%\n\n`;
  
  report += `## 圖標分類\n`;
  for (const [category, categoryIcons] of Object.entries(analysis.byCategory)) {
    if (categoryIcons.length > 0) {
      report += `### ${category}\n`;
      report += `數量: ${categoryIcons.length}\n`;
      report += `圖標: ${categoryIcons.join(', ')}\n\n`;
    }
  }
  
  report += `## 載入策略建議\n`;
  report += `### 立即載入 (${analysis.recommendations.toImmediate.length} 個)\n`;
  report += `${analysis.recommendations.toImmediate.join(', ')}\n\n`;
  
  report += `### 預載入 (${analysis.recommendations.toPreload.length} 個)\n`;
  report += `${analysis.recommendations.toPreload.join(', ')}\n\n`;
  
  report += `### 懶載入 (${analysis.recommendations.toLazy.length} 個)\n`;
  report += `${analysis.recommendations.toLazy.join(', ')}\n\n`;
  
  if (analysis.replacements.length > 0) {
    report += `## 替換建議\n`;
    for (const replacement of analysis.replacements) {
      report += `- \`${replacement.from}\` → \`${replacement.to}\` (${replacement.reason})\n`;
    }
    report += `\n`;
  }
  
  report += `## 實施建議\n`;
  report += `1. 將高頻圖標移至 DynamicIcon 的立即載入列表\n`;
  report += `2. 為業務核心圖標設置預載入策略\n`;
  report += `3. 使用 DynamicIcon 組件統一管理圖標載入\n`;
  report += `4. 實施圖標替換建議以提升一致性\n`;
  
  return report;
}

/**
 * 生成圖標導入替換腳本
 */
export function generateReplacementScript(icons: string[]): string {
  const analysis = analyzeIconUsage(icons);
  
  let script = `// 圖標導入優化腳本\n`;
  script += `// 建議使用 DynamicIcon 組件替換直接導入\n\n`;
  
  script += `// 替換前:\n`;
  script += `// import { ${icons.join(', ')} } from "lucide-react";\n\n`;
  
  script += `// 替換後:\n`;
  script += `import { DynamicIcon } from "@/components/ui/DynamicIcon";\n\n`;
  
  script += `// 使用示例:\n`;
  script += `// <Edit className="h-4 w-4" /> \n`;
  script += `// 替換為:\n`;
  script += `// <DynamicIcon name="Edit" className="h-4 w-4" />\n\n`;
  
  if (analysis.replacements.length > 0) {
    script += `// 圖標名稱統一建議:\n`;
    for (const replacement of analysis.replacements) {
      script += `// ${replacement.from} → ${replacement.to}\n`;
    }
  }
  
  return script;
}