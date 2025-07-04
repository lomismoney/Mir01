const nextJest = require('next/jest')

/**
 * Jest 測試框架配置
 * 
 * 為 Next.js 專案提供完整的測試環境配置，
 * 支援 TypeScript、React 組件測試和 API 模擬
 */
const createJestConfig = nextJest({
  // 提供 Next.js 應用的根目錄路徑
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  // 設置測試環境為 jsdom（模擬瀏覽器環境）
  testEnvironment: 'jsdom',
  
  // 在每個測試文件執行前運行的設置腳本
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // 模組名稱映射（處理路徑別名）
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs|@bundled-es-modules|node-fetch|next-auth|@auth/core)/)',
  ],
  moduleNameMapper: {
    '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/test-utils/(.*)$': '<rootDir>/src/test-utils/$1',
    // 處理 CSS 模組
    '^.+\.module\.(css|sass|scss)$': 'identity-obj-proxy',
    // 處理圖片導入
    '^.+\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // 測試檔案匹配模式
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  
  // 忽略的測試檔案或目錄
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  
  // 收集測試覆蓋率配置
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts', // 通常只是匯出檔案
  ],
  
  // 覆蓋率閾值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// 匯出使用 Next.js 優化的 Jest 配置
module.exports = createJestConfig(config)