#!/usr/bin/env ts-node

/**
 * 圖標使用分析和優化報告生成器
 * 
 * 使用方法：
 * npx ts-node src/scripts/generateIconReport.ts
 */

import fs from 'fs';
import path from 'path';
import { analyzeIconUsage, generateOptimizationReport } from '../lib/iconOptimizer';

// 掃描目錄配置
const SCAN_DIRECTORIES = [
  'src/components',
  'src/app',
  'src/lib',
  'src/hooks'
];

const ICON_IMPORT_PATTERNS = [
  /import\s*{([^}]+)}\s*from\s*["']lucide-react["']/g,
  /from\s*["']lucide-react["']/g,
  /<(\w+Icon?)\s/g,  // 匹配 JSX 中的圖標使用
];

/**
 * 遞歸掃描目錄中的文件
 */
function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // 跳過 node_modules, .git 等目錄
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...scanDirectory(fullPath));
        }
      } else if (entry.isFile()) {
        // 只處理 TypeScript/JavaScript/React 文件
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to scan directory ${dirPath}:`, error);
  }
  
  return files;
}

/**
 * 從文件內容中提取圖標名稱
 */
function extractIconsFromFile(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const icons: string[] = [];
    
    // 匹配 import 語句中的圖標
    const importMatches = content.matchAll(/import\s*{([^}]+)}\s*from\s*["']lucide-react["']/g);
    for (const match of importMatches) {
      const importedIcons = match[1]
        .split(',')
        .map(icon => icon.trim().replace(/\s+as\s+\w+/g, '')) // 移除 alias
        .filter(icon => icon && icon !== '');
      icons.push(...importedIcons);
    }
    
    // 匹配 JSX 中直接使用的圖標（不在 import 中）
    const jsxMatches = content.matchAll(/<(\w+)(?:\s|>)/g);
    for (const match of jsxMatches) {
      const tagName = match[1];
      // 如果是大寫開頭且可能是圖標名稱
      if (/^[A-Z]/.test(tagName) && 
          (tagName.includes('Icon') || 
           ['Check', 'X', 'Plus', 'Minus', 'Arrow', 'Chevron', 'More', 'Search', 'Edit', 'Trash', 'Save', 'Eye'].some(prefix => tagName.includes(prefix)))) {
        icons.push(tagName);
      }
    }
    
    return [...new Set(icons)]; // 去重
  } catch (error) {
    console.warn(`Failed to read file ${filePath}:`, error);
    return [];
  }
}

/**
 * 生成使用統計
 */
function generateUsageStats(iconUsage: Record<string, number>): {
  mostUsed: Array<{ icon: string; count: number }>;
  leastUsed: Array<{ icon: string; count: number }>;
  totalUnique: number;
  totalUsage: number;
} {
  const sortedByUsage = Object.entries(iconUsage)
    .map(([icon, count]) => ({ icon, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    mostUsed: sortedByUsage.slice(0, 10),
    leastUsed: sortedByUsage.slice(-10).reverse(),
    totalUnique: sortedByUsage.length,
    totalUsage: sortedByUsage.reduce((sum, item) => sum + item.count, 0),
  };
}

/**
 * 主函數
 */
async function main() {
  console.log('🔍 開始掃描圖標使用情況...\n');
  
  // 收集所有文件
  const allFiles: string[] = [];
  for (const dir of SCAN_DIRECTORIES) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      allFiles.push(...scanDirectory(dirPath));
    }
  }
  
  console.log(`📁 掃描了 ${allFiles.length} 個文件\n`);
  
  // 提取圖標使用情況
  const iconUsage: Record<string, number> = {};
  const fileIconMap: Record<string, string[]> = {};
  
  for (const file of allFiles) {
    const icons = extractIconsFromFile(file);
    if (icons.length > 0) {
      fileIconMap[path.relative(process.cwd(), file)] = icons;
      
      for (const icon of icons) {
        iconUsage[icon] = (iconUsage[icon] || 0) + 1;
      }
    }
  }
  
  // 生成統計數據
  const stats = generateUsageStats(iconUsage);
  const allIcons = Object.keys(iconUsage);
  
  // 生成優化分析
  const analysis = analyzeIconUsage(allIcons);
  const optimizationReport = generateOptimizationReport(allIcons);
  
  // 創建完整報告
  let report = `# 圖標使用分析報告\n\n`;
  report += `生成時間: ${new Date().toLocaleString('zh-TW')}\n\n`;
  
  // 總體統計
  report += `## 📊 總體統計\n\n`;
  report += `- **掃描文件數**: ${allFiles.length}\n`;
  report += `- **使用圖標文件數**: ${Object.keys(fileIconMap).length}\n`;
  report += `- **唯一圖標數量**: ${stats.totalUnique}\n`;
  report += `- **總使用次數**: ${stats.totalUsage}\n`;
  report += `- **平均每個圖標使用次數**: ${(stats.totalUsage / stats.totalUnique).toFixed(1)}\n\n`;
  
  // 最常用圖標
  report += `## 🔥 最常用圖標 (前10名)\n\n`;
  report += `| 圖標 | 使用次數 | 百分比 |\n`;
  report += `|------|----------|--------|\n`;
  for (const { icon, count } of stats.mostUsed) {
    const percentage = ((count / stats.totalUsage) * 100).toFixed(1);
    report += `| \`${icon}\` | ${count} | ${percentage}% |\n`;
  }
  report += `\n`;
  
  // 較少使用圖標
  report += `## 📉 較少使用圖標 (後10名)\n\n`;
  report += `| 圖標 | 使用次數 |\n`;
  report += `|------|----------|\n`;
  for (const { icon, count } of stats.leastUsed) {
    report += `| \`${icon}\` | ${count} |\n`;
  }
  report += `\n`;
  
  // 添加優化分析報告
  report += optimizationReport;
  
  // 文件詳細使用情況
  report += `\n## 📁 文件圖標使用詳情\n\n`;
  const sortedFiles = Object.entries(fileIconMap)
    .sort(([, iconsA], [, iconsB]) => iconsB.length - iconsA.length);
  
  for (const [file, icons] of sortedFiles.slice(0, 20)) {
    report += `### ${file}\n`;
    report += `使用 ${icons.length} 個圖標: ${icons.join(', ')}\n\n`;
  }
  
  // 寫入報告文件
  const reportPath = path.join(process.cwd(), 'icon-usage-report.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log('✅ 分析完成！');
  console.log(`📄 報告已生成: ${reportPath}`);
  console.log(`\n📊 快速統計:`);
  console.log(`   - 唯一圖標: ${stats.totalUnique}`);
  console.log(`   - 總使用次數: ${stats.totalUsage}`);
  console.log(`   - 最常用: ${stats.mostUsed[0]?.icon} (${stats.mostUsed[0]?.count} 次)`);
  console.log(`\n💡 建議: 查看生成的報告以獲得詳細的優化建議`);
}

// 執行腳本
if (require.main === module) {
  main().catch(console.error);
}