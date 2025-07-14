// 動態導入 node-fetch 以支援 ES6 模組
(async () => {
  const { Request, Response } = await import('node-fetch');
  global.Request = Request;
  global.Response = Response;
})();

/**
 * Jest 測試環境設置
 * 
 * 配置測試環境，引入必要的測試工具和全局設置
 */


// 引入 @testing-library/jest-dom 的自定義匹配器
import '@testing-library/jest-dom'

// 設置全局 fetch（如果需要）
global.fetch = jest.fn()

// Polyfill for structuredClone (not available in Jest environment)
global.structuredClone = global.structuredClone || ((obj) => JSON.parse(JSON.stringify(obj)))

// 模擬 Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// 模擬 next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      },
      accessToken: 'test-token',
    },
    status: 'authenticated',
  })),
  getSession: jest.fn(() => Promise.resolve({
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    },
    accessToken: 'test-token',
  })),
}))

// 模擬 sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}))

// 模擬 window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // 已棄用
    removeListener: jest.fn(), // 已棄用
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Polyfill for PointerEvent to fix user-event/Radix UI issues in tests
if (typeof window !== 'undefined' && !window.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type, params) {
      super(type, params);
      this.pointerId = params.pointerId;
    }
  }
  window.PointerEvent = PointerEvent;
}

if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = jest.fn();
  HTMLElement.prototype.releasePointerCapture = jest.fn();
  HTMLElement.prototype.scrollIntoView = jest.fn();
}

// 模擬 IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// 模擬 ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// 抑制特定的控制台警告（如果需要）
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
}) 