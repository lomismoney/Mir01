# 前端測試指南

## 概述

本專案使用以下測試技術棧：
- **Jest**: JavaScript 測試框架
- **React Testing Library**: React 組件測試工具
- **MSW (Mock Service Worker)**: API 模擬工具
- **TypeScript**: 類型安全的測試

## 測試架構

### 1. 測試環境設置

```
inventory-client/
├── jest.config.js          # Jest 配置
├── jest.setup.js           # 測試環境設置
├── __mocks__/              # 全局模擬
├── src/
│   ├── test-utils/         # 測試工具
│   │   ├── test-utils.tsx  # 自定義 render 函數
│   │   └── mocks/          # MSW 模擬
│   │       ├── server.ts   # MSW 服務器設置
│   │       └── handlers.ts # API 處理器
│   └── **/__tests__/       # 測試文件
```

### 2. 測試類型

#### 單元測試
- **Hooks 測試**: 測試自定義 React hooks
- **工具函數測試**: 測試純函數邏輯
- **API 客戶端測試**: 測試 API 調用邏輯

#### 組件測試
- **渲染測試**: 確保組件正確渲染
- **交互測試**: 測試用戶交互
- **狀態測試**: 測試組件狀態變化

#### 集成測試
- **數據流測試**: 測試組件與 API 的整合
- **路由測試**: 測試頁面導航

## 安裝測試環境

```bash
# 進入前端目錄
cd inventory-client

# 安裝測試依賴
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest jest jest-environment-jsdom msw ts-jest @jest/globals
```

## 運行測試

```bash
# 運行所有測試
npm test

# 監聽模式（開發時使用）
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage

# 運行特定測試文件
npm test -- ProductClientComponent.test.tsx

# 運行特定測試套件
npm test -- --testNamePattern="useProducts"
```

## 測試最佳實踐

### 1. 組件測試

```typescript
import { render, screen, waitFor } from '@/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('應該處理用戶點擊', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    const button = screen.getByRole('button', { name: '點擊我' })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('已點擊')).toBeInTheDocument()
    })
  })
})
```

### 2. Hooks 測試

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useMyHook } from './useMyHook'

describe('useMyHook', () => {
  it('應該返回正確的數據', async () => {
    const { result } = renderHook(() => useMyHook())
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toEqual(expectedData)
  })
})
```

### 3. API 模擬

```typescript
import { server } from '@/test-utils/mocks/server'
import { http, HttpResponse } from 'msw'

// 在特定測試中覆蓋默認處理器
server.use(
  http.get('/api/products', () => {
    return HttpResponse.json({ data: customData })
  })
)
```

## 測試命名規範

1. **測試文件**: `ComponentName.test.tsx` 或 `functionName.test.ts`
2. **測試套件**: 使用 `describe` 描述測試對象
3. **測試用例**: 使用 `it` 或 `test`，描述應該發生的行為

```typescript
describe('ProductList', () => {
  it('應該顯示商品列表', () => {})
  it('應該在沒有商品時顯示空狀態', () => {})
  it('應該處理加載錯誤', () => {})
})
```

## 測試覆蓋率目標

- **整體覆蓋率**: 70% 以上
- **關鍵業務邏輯**: 90% 以上
- **工具函數**: 100%
- **UI 組件**: 60% 以上

## 常見問題

### 1. 測試環境中的認證

測試環境預設使用模擬的認證狀態：

```typescript
// jest.setup.js 中的默認設置
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 1, name: 'Test User', role: 'admin' },
      accessToken: 'test-token',
    },
    status: 'authenticated',
  }),
}))
```

### 2. 處理異步操作

使用 `waitFor` 等待異步操作完成：

```typescript
await waitFor(() => {
  expect(screen.getByText('數據已加載')).toBeInTheDocument()
})
```

### 3. 測試隔離

每個測試應該獨立運行，不依賴其他測試的狀態：

```typescript
beforeEach(() => {
  // 重置測試狀態
})

afterEach(() => {
  // 清理副作用
  server.resetHandlers()
})
```

## 調試測試

### 1. 使用 screen.debug()

```typescript
screen.debug() // 打印當前 DOM
screen.debug(element) // 打印特定元素
```

### 2. 使用 console.log

在測試中使用 `console.log` 調試數據流

### 3. 運行單個測試

使用 `.only` 只運行特定測試：

```typescript
it.only('應該只運行這個測試', () => {})
```

## 持續集成

在 CI/CD 流程中運行測試：

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run build
```

## 相關資源

- [Jest 文檔](https://jestjs.io/)
- [React Testing Library 文檔](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW 文檔](https://mswjs.io/)
- [Testing Library 查詢優先級](https://testing-library.com/docs/queries/about#priority) 