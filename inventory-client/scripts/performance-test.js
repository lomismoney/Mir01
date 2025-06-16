#!/usr/bin/env node

/**
 * TailwindCSS 編譯性能測試腳本 🚀
 * 
 * 用途：測量 TailwindCSS 編譯時間，驗證性能優化效果
 * 使用方法：node scripts/performance-test.js
 * 
 * 基於 Panga Games 的發現進行性能監控
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 TailwindCSS 性能測試開始...\n');

// 測試配置
const tests = [
  {
    name: '開發模式啟動',
    command: 'npm run dev',
    timeout: 30000, // 30秒超時
    description: '測量 Next.js 開發伺服器啟動時間'
  },
  {
    name: '生產建置',
    command: 'npm run build',
    timeout: 120000, // 2分鐘超時
    description: '測量完整建置時間'
  }
];

// 檢查專案檔案統計
function getProjectStats() {
  const stats = {
    totalFiles: 0,
    scannedFiles: 0,
    excludedFiles: 0,
    largeFiles: []
  };

  function scanDirectory(dir, isExcluded = false) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 檢查是否為排除的目錄
          const dirExcluded = isExcluded || 
            item === 'node_modules' || 
            item === '.next' || 
            item === 'data' || 
            item === 'mock' ||
            item === 'docs';
          
          scanDirectory(fullPath, dirExcluded);
        } else {
          stats.totalFiles++;
          
          if (isExcluded || 
              item.endsWith('.tsbuildinfo') ||
              item.endsWith('.yaml') ||
              item.endsWith('.json') && item !== 'package.json') {
            stats.excludedFiles++;
          } else if (item.match(/\.(js|ts|jsx|tsx|mdx)$/)) {
            stats.scannedFiles++;
          }
          
          // 記錄大型檔案 (>100KB)
          if (stat.size > 100 * 1024) {
            stats.largeFiles.push({
              path: fullPath.replace(process.cwd(), '.'),
              size: Math.round(stat.size / 1024) + 'KB'
            });
          }
        }
      }
    } catch (error) {
      // 忽略權限錯誤
    }
  }

  scanDirectory('./src');
  scanDirectory('.', false);
  
  return stats;
}

// 執行性能測試
async function runPerformanceTest() {
  console.log('📊 專案檔案統計：');
  const stats = getProjectStats();
  
  console.log(`   總檔案數：${stats.totalFiles}`);
  console.log(`   TailwindCSS 掃描檔案：${stats.scannedFiles}`);
  console.log(`   排除檔案：${stats.excludedFiles}`);
  console.log(`   掃描比例：${Math.round((stats.scannedFiles / stats.totalFiles) * 100)}%\n`);
  
  if (stats.largeFiles.length > 0) {
    console.log('⚠️  發現大型檔案（可能影響性能）：');
    stats.largeFiles.slice(0, 5).forEach(file => {
      console.log(`   ${file.path} (${file.size})`);
    });
    if (stats.largeFiles.length > 5) {
      console.log(`   ... 還有 ${stats.largeFiles.length - 5} 個大型檔案`);
    }
    console.log();
  }

  // 測量建置時間
  console.log('⏱️  測量建置時間：');
  
  try {
    const startTime = Date.now();
    
    // 清理快取
    try {
      execSync('rm -rf .next', { stdio: 'ignore' });
    } catch (e) {
      // Windows 相容性
      try {
        execSync('rmdir /s /q .next', { stdio: 'ignore' });
      } catch (e2) {
        // 忽略清理錯誤
      }
    }
    
    // 執行建置
    console.log('   正在執行 npm run build...');
    execSync('npm run build', { 
      stdio: 'pipe',
      timeout: 120000 
    });
    
    const buildTime = Date.now() - startTime;
    console.log(`   ✅ 建置完成：${Math.round(buildTime / 1000)}秒\n`);
    
    // 性能評估
    if (buildTime < 30000) {
      console.log('🚀 性能評估：優秀 (<30秒)');
    } else if (buildTime < 60000) {
      console.log('✅ 性能評估：良好 (30-60秒)');
    } else if (buildTime < 120000) {
      console.log('⚠️  性能評估：需要優化 (1-2分鐘)');
    } else {
      console.log('❌ 性能評估：性能問題 (>2分鐘)');
    }
    
  } catch (error) {
    console.log('❌ 建置失敗：', error.message);
  }
}

// 主函數
async function main() {
  try {
    await runPerformanceTest();
    
    console.log('\n📋 性能優化建議：');
    console.log('1. 確保 .gitignore 排除了大型檔案');
    console.log('2. 檢查 tailwind.config.ts 的 content 配置');
    console.log('3. 避免在 src/ 目錄放置大型資料檔案');
    console.log('4. 定期清理 .next/ 和 node_modules/');
    
  } catch (error) {
    console.error('❌ 測試失敗：', error.message);
    process.exit(1);
  }
}

// 執行測試
if (require.main === module) {
  main();
}

module.exports = { getProjectStats, runPerformanceTest }; 