/**
 * useIsMobile Hook 測試
 * 
 * 測試移動設備檢測 hook 的功能
 */
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

// 模擬 window.matchMedia
const mockMatchMedia = jest.fn()

// 設置全局模擬
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// 模擬 window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

describe('useIsMobile', () => {
  let mockMediaQueryList: {
    matches: boolean
    addEventListener: jest.Mock
    removeEventListener: jest.Mock
  }

  beforeEach(() => {
    mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    mockMatchMedia.mockReturnValue(mockMediaQueryList)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('應該在桌面模式下返回 false', () => {
    // 設置桌面寬度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('應該在移動模式下返回 true', () => {
    // 設置移動設備寬度 (< 768px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('應該在臨界點 768px 處正確判斷', () => {
    // 設置為臨界點 (768px 為桌面模式)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    // 設置為 767px (移動模式)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    })

    const { result: mobileResult } = renderHook(() => useIsMobile())

    expect(mobileResult.current).toBe(true)
  })

  it('應該註冊和移除事件監聽器', () => {
    const { unmount } = renderHook(() => useIsMobile())

    // 檢查是否註冊了事件監聽器
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )

    // 卸載組件
    unmount()

    // 檢查是否移除了事件監聽器
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('應該響應媒體查詢變化', () => {
    // 初始設置為桌面
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    // 模擬視窗大小變化到移動設備
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    })

    // 獲取註冊的事件處理器
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]

    // 觸發媒體查詢變化
    act(() => {
      changeHandler()
    })

    expect(result.current).toBe(true)
  })

  it('應該在服務器端渲染時默認為桌面模式', () => {
    // 模擬服務器端環境（沒有 window.innerWidth）
    const originalInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth')
    
    // 故意刪除 innerWidth 來模擬 SSR 環境
    delete (window as Window & { innerWidth?: number }).innerWidth

    const { result } = renderHook(() => useIsMobile())

    // 初始狀態應該是 false（桌面模式）
    expect(result.current).toBe(false)

    // 恢復 innerWidth
    if (originalInnerWidth) {
      Object.defineProperty(window, 'innerWidth', originalInnerWidth)
    }
  })

  it('應該正確處理多次視窗大小變化', () => {
    // 初始為桌面
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    const changeHandler = mockMediaQueryList.addEventListener.mock.calls[0][1]

    expect(result.current).toBe(false)

    // 變化到移動設備
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 480,
    })

    act(() => {
      changeHandler()
    })

    expect(result.current).toBe(true)

    // 變化回桌面
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    })

    act(() => {
      changeHandler()
    })

    expect(result.current).toBe(false)
  })

  it('應該使用正確的斷點 (768px)', () => {
    // 檢查 matchMedia 是否使用了正確的斷點
    renderHook(() => useIsMobile())

    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })
}) 