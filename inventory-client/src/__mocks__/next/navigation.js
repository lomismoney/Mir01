/**
 * __mocks__/next/navigation.js
 *
 * 根據專案文件建議，使用 __mocks__ 目錄來 mock next/navigation。
 * 修正 useRouter 的 mock 方式，使其返回一個包含 mock 函數的物件。
 */

export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  // 添加其他可能用到的方法，例如 back, prefetch 等
  back: jest.fn(),
  prefetch: jest.fn(),
}));
