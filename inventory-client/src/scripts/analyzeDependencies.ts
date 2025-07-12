#!/usr/bin/env ts-node

/**
 * 依賴使用分析工具
 * 
 * 檢查項目中未使用的依賴並生成清理建議
 * 
 * 使用方法：
 * npx ts-node src/scripts/analyzeDependencies.ts
 */

import fs from 'fs';
import path from 'path';

// 掃描目錄配置
const SCAN_DIRECTORIES = [
  'src',
  'pages', // 如果有 pages 目錄
];

// 排除掃描的目錄和文件
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '__tests__',
  '*.test.*',
  '*.spec.*',
  'coverage',
  '.turbo'
];

/**
 * 讀取 package.json
 */
function readPackageJson(): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf-8');
  const packageJson = JSON.parse(packageContent);
  
  return {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
  };
}

/**
 * 遞歸掃描目錄中的文件
 */
function scanDirectory(dirPath: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);
      
      // 檢查是否應該排除
      if (EXCLUDE_PATTERNS.some(pattern => 
        relativePath.includes(pattern) || entry.name.includes(pattern)
      )) {
        continue;
      }
      
      if (entry.isDirectory()) {
        files.push(...scanDirectory(fullPath));
      } else if (entry.isFile()) {
        // 只處理代碼文件
        if (/\.(ts|tsx|js|jsx|json|md)$/.test(entry.name)) {
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
 * 從文件內容中提取導入的包名
 */
function extractImportsFromFile(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports: string[] = [];
    
    // 匹配各種 import 語句
    const importPatterns = [
      // import ... from "package"
      /import\s+(?:[^"']*\s+from\s+)?["']([^"']+)["']/g,
      // require("package")
      /require\s*\(\s*["']([^"']+)["']\s*\)/g,
      // import("package")
      /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    ];
    
    for (const pattern of importPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const importPath = match[1];
        
        // 只關心 node_modules 包，忽略相對路徑
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
          // 提取包名（處理 scoped packages）
          const packageName = importPath.startsWith('@') 
            ? importPath.split('/').slice(0, 2).join('/')
            : importPath.split('/')[0];
          
          imports.push(packageName);
        }
      }
    }
    
    return [...new Set(imports)]; // 去重
  } catch (error) {
    console.warn(`Failed to read file ${filePath}:`, error);
    return [];
  }
}

/**
 * 分析特殊用法（配置文件等）
 */
function analyzeSpecialUsages(): string[] {
  const specialPackages: string[] = [];
  
  // 檢查配置文件中的使用
  const configFiles = [
    'tailwind.config.js',
    'tailwind.config.ts',
    'next.config.js',
    'next.config.ts',
    'jest.config.js',
    'jest.config.ts',
    'jest.setup.js',
    'jest.setup.ts',
    'postcss.config.js',
    'eslint.config.js',
    '.eslintrc.js',
    '.eslintrc.json',
  ];
  
  for (const configFile of configFiles) {
    const configPath = path.join(process.cwd(), configFile);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        
        // 檢查常見的配置包使用
        if (content.includes('tailwindcss')) specialPackages.push('tailwindcss');
        if (content.includes('autoprefixer')) specialPackages.push('autoprefixer');
        if (content.includes('postcss')) specialPackages.push('postcss');
        if (content.includes('@testing-library')) {
          specialPackages.push('@testing-library/jest-dom');
          specialPackages.push('@testing-library/react');
          specialPackages.push('@testing-library/user-event');
        }
        if (content.includes('jest')) {
          specialPackages.push('jest');
          specialPackages.push('jest-environment-jsdom');
          specialPackages.push('@types/jest');
        }
        if (content.includes('eslint')) {
          specialPackages.push('eslint');
          specialPackages.push('eslint-config-next');
        }
        
        // 提取其他導入
        const imports = extractImportsFromFile(configPath);
        specialPackages.push(...imports);
      } catch (error) {
        console.warn(`Failed to analyze config file ${configFile}:`, error);
      }
    }
  }
  
  return [...new Set(specialPackages)];
}

/**
 * 檢查 Next.js 和 React 相關的隱式依賴
 */
function getImplicitDependencies(): string[] {
  return [
    // Next.js 核心
    'next',
    'react',
    'react-dom',
    
    // TypeScript 相關
    'typescript',
    '@types/node',
    '@types/react',
    '@types/react-dom',
    
    // 構建工具
    'autoprefixer',
    'postcss',
    'tailwindcss',
    
    // OpenAPI 工具
    'openapi-typescript',
    'openapi-fetch',
    
    // 測試框架（即使未直接導入也需要）
    'jest',
    'jest-environment-jsdom',
    '@types/jest',
    '@testing-library/jest-dom',
    
    // ESLint
    'eslint',
    'eslint-config-next',
    '@eslint/eslintrc',
    
    // MSW (Mock Service Worker)
    'msw',
    'node-fetch',
    
    // 全局 polyfills
    'tw-animate-css'
  ];
}

/**
 * 生成未使用依賴報告
 */
function generateUnusedDependenciesReport(
  unusedDeps: string[],
  unusedDevDeps: string[],
  allUsedPackages: Set<string>,
  packageJson: { dependencies: Record<string, string>; devDependencies: Record<string, string> }
): string {
  let report = `# 依賴使用分析報告\n\n`;
  report += `生成時間: ${new Date().toLocaleString('zh-TW')}\n\n`;
  
  // 統計信息
  const totalDeps = Object.keys(packageJson.dependencies).length;
  const totalDevDeps = Object.keys(packageJson.devDependencies).length;
  const usedDeps = totalDeps - unusedDeps.length;
  const usedDevDeps = totalDevDeps - unusedDevDeps.length;
  
  report += `## 📊 依賴統計\n\n`;
  report += `### 生產依賴 (dependencies)\n`;
  report += `- 總數: ${totalDeps}\n`;
  report += `- 使用中: ${usedDeps}\n`;
  report += `- 未使用: ${unusedDeps.length}\n`;
  report += `- 使用率: ${((usedDeps / totalDeps) * 100).toFixed(1)}%\n\n`;
  
  report += `### 開發依賴 (devDependencies)\n`;
  report += `- 總數: ${totalDevDeps}\n`;
  report += `- 使用中: ${usedDevDeps}\n`;
  report += `- 未使用: ${unusedDevDeps.length}\n`;
  report += `- 使用率: ${((usedDevDeps / totalDevDeps) * 100).toFixed(1)}%\n\n`;
  
  // 未使用的生產依賴
  if (unusedDeps.length > 0) {
    report += `## ⚠️ 未使用的生產依賴\n\n`;
    report += `以下依賴可能可以安全移除：\n\n`;
    for (const dep of unusedDeps) {
      const version = packageJson.dependencies[dep];
      report += `- \`${dep}@${version}\`\n`;
    }
    report += `\n**移除命令:**\n`;
    report += `\`\`\`bash\nnpm uninstall ${unusedDeps.join(' ')}\n\`\`\`\n\n`;
  }
  
  // 未使用的開發依賴
  if (unusedDevDeps.length > 0) {
    report += `## 🛠️ 未使用的開發依賴\n\n`;
    report += `以下開發依賴可能可以安全移除：\n\n`;
    for (const dep of unusedDevDeps) {
      const version = packageJson.devDependencies[dep];
      report += `- \`${dep}@${version}\`\n`;
    }
    report += `\n**移除命令:**\n`;
    report += `\`\`\`bash\nnpm uninstall ${unusedDevDeps.join(' ')}\n\`\`\`\n\n`;
  }
  
  // 重複或可能重複的依賴
  report += `## 🔍 需要檢查的依賴\n\n`;
  report += `### 可能的功能重複\n`;
  const potentialDuplicates = [
    { packages: ['@tabler/icons-react', 'lucide-react'], reason: '都是圖標庫，可能只需要一個' },
    { packages: ['lodash.debounce', '@types/lodash.debounce'], reason: '可以考慮使用自定義 hook 替代' },
  ];
  
  for (const { packages, reason } of potentialDuplicates) {
    const presentPackages = packages.filter(pkg => 
      allUsedPackages.has(pkg) || packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]
    );
    
    if (presentPackages.length > 0) {
      report += `- ${presentPackages.join(', ')}: ${reason}\n`;
    }
  }
  
  // 建議
  report += `\n## 💡 優化建議\n\n`;
  
  if (unusedDeps.length > 0 || unusedDevDeps.length > 0) {
    report += `1. **移除未使用依賴**: 可以減少 node_modules 大小和構建時間\n`;
  }
  
  report += `2. **圖標庫整合**: 考慮統一使用 lucide-react，移除 @tabler/icons-react\n`;
  report += `3. **工具函數**: 評估是否需要 lodash.debounce，可以用自定義 hook 替代\n`;
  report += `4. **定期檢查**: 建議每個月執行一次依賴分析，保持項目精簡\n\n`;
  
  report += `## ⚠️ 注意事項\n\n`;
  report += `- 移除依賴前請仔細測試應用功能\n`;
  report += `- 某些依賴可能被配置文件或運行時動態使用\n`;
  report += `- 開發依賴的移除相對安全，但仍需注意測試和構建流程\n`;
  report += `- Next.js 和相關工具鏈依賴建議保留\n`;
  
  return report;
}

/**
 * 主函數
 */
async function main() {
  console.log('🔍 開始分析項目依賴使用情況...\n');
  
  // 讀取 package.json
  const packageJson = readPackageJson();
  const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  console.log(`📦 發現 ${Object.keys(packageJson.dependencies).length} 個生產依賴`);
  console.log(`🛠️ 發現 ${Object.keys(packageJson.devDependencies).length} 個開發依賴\n`);
  
  // 收集所有源碼文件
  const allFiles: string[] = [];
  for (const dir of SCAN_DIRECTORIES) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      allFiles.push(...scanDirectory(dirPath));
    }
  }
  
  console.log(`📁 掃描了 ${allFiles.length} 個文件\n`);
  
  // 提取所有使用的包
  const usedPackages = new Set<string>();
  
  // 從源碼文件中提取
  for (const file of allFiles) {
    const imports = extractImportsFromFile(file);
    imports.forEach(pkg => usedPackages.add(pkg));
  }
  
  // 添加特殊用法
  const specialUsages = analyzeSpecialUsages();
  specialUsages.forEach(pkg => usedPackages.add(pkg));
  
  // 添加隱式依賴
  const implicitDeps = getImplicitDependencies();
  implicitDeps.forEach(pkg => usedPackages.add(pkg));
  
  console.log(`📋 檢測到 ${usedPackages.size} 個被使用的包\n`);
  
  // 分析未使用的依賴
  const unusedDependencies = Object.keys(packageJson.dependencies)
    .filter(dep => !usedPackages.has(dep));
  
  const unusedDevDependencies = Object.keys(packageJson.devDependencies)
    .filter(dep => !usedPackages.has(dep));
  
  // 生成報告
  const report = generateUnusedDependenciesReport(
    unusedDependencies,
    unusedDevDependencies,
    usedPackages,
    packageJson
  );
  
  // 寫入報告文件
  const reportPath = path.join(process.cwd(), 'dependency-analysis-report.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log('✅ 分析完成！');
  console.log(`📄 報告已生成: ${reportPath}`);
  console.log(`\n📊 快速統計:`);
  console.log(`   - 未使用的生產依賴: ${unusedDependencies.length}`);
  console.log(`   - 未使用的開發依賴: ${unusedDevDependencies.length}`);
  
  if (unusedDependencies.length > 0) {
    console.log(`\n⚠️ 未使用的生產依賴: ${unusedDependencies.join(', ')}`);
  }
  
  if (unusedDevDependencies.length > 0) {
    console.log(`\n🛠️ 未使用的開發依賴: ${unusedDevDependencies.join(', ')}`);
  }
  
  console.log(`\n💡 查看完整報告以獲得詳細的移除建議`);
}

// 執行腳本
if (require.main === module) {
  main().catch(console.error);
}