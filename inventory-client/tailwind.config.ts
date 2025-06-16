import type { Config } from 'tailwindcss'

/**
 * TailwindCSS v4 配置檔案 - 性能優化版本 🚀
 * 
 * 性能優化特性：
 * 1. 明確指定掃描路徑，避免掃描大型檔案
 * 2. 排除不必要的檔案類型
 * 3. 針對 Next.js App Router 優化
 * 
 * 參考：https://github.com/tailwindlabs/tailwindcss.com 最佳實踐
 */
export default {
  content: [
    // ✅ 明確指定需要掃描的檔案路徑
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
    './src/providers/**/*.{js,ts,jsx,tsx}',
    './src/actions/**/*.{js,ts,jsx,tsx}',
    './src/queries/**/*.{js,ts,jsx,tsx}',
    
    // ✅ 包含根目錄的特定檔案
    './auth.ts',
    './middleware.ts',
    
    // ❌ 明確排除大型檔案和不需要的路徑
    '!./src/**/*.{json,yaml,yml,md}',
    '!./src/data/**/*',
    '!./src/mock/**/*',
    '!./src/fixtures/**/*',
    '!./openapi.yaml',
    '!./*.tsbuildinfo',
  ],
  theme: {
    extend: {
      // 保持現有的主題擴展
    },
  },
  plugins: [
    // 保持現有的插件
  ],
} satisfies Config 