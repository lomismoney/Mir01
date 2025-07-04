/**
 * useDebounce Hook 測試
 * 
 * 測試防抖 hook 的各種使用場景
 */
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

// 模擬 setTimeout 和 clearTimeout
jest.useFakeTimers()

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('應該返回初始值', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  it('應該在延遲後更新值', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    expect(result.current).toBe('initial')

    // 更新值
    rerender({ value: 'updated', delay: 500 })

    // 立即檢查，值應該還是舊的
    expect(result.current).toBe('initial')

    // 快進時間，但還沒到延遲時間
    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current).toBe('initial')

    // 快進到延遲時間結束
    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current).toBe('updated')
  })

  it('應該重置計時器當值快速變化時', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    // 第一次更新
    rerender({ value: 'first', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(300)
    })
    
    // 第二次更新（在第一次延遲完成前）
    rerender({ value: 'second', delay: 500 })
    
    // 快進到原本第一次更新應該完成的時間
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    // 值應該還是 initial，因為計時器被重置了
    expect(result.current).toBe('initial')
    
    // 快進剩餘時間
    act(() => {
      jest.advanceTimersByTime(300)
    })
    
    // 現在應該是最新的值
    expect(result.current).toBe('second')
  })

  it('應該處理不同的延遲時間', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 }
      }
    )

    rerender({ value: 'updated', delay: 1000 })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })

  it('應該處理延遲時間變化', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    rerender({ value: 'updated', delay: 1000 })

    // 使用新的延遲時間
    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })

  it('應該處理零延遲', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 }
      }
    )

    rerender({ value: 'updated', delay: 0 })

    act(() => {
      jest.advanceTimersByTime(0)
    })

    expect(result.current).toBe('updated')
  })

  it('應該處理不同類型的值', () => {
    // 測試數字
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 100 }
      }
    )

    numberRerender({ value: 42, delay: 100 })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(numberResult.current).toBe(42)

    // 測試物件
    const initialObj = { id: 1, name: 'test' }
    const updatedObj = { id: 2, name: 'updated' }

    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 100 }
      }
    )

    objectRerender({ value: updatedObj, delay: 100 })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(objectResult.current).toBe(updatedObj)

    // 測試陣列
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: [1, 2, 3], delay: 100 }
      }
    )

    arrayRerender({ value: [4, 5, 6], delay: 100 })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(arrayResult.current).toEqual([4, 5, 6])
  })

  it('應該在連續快速更新中只保留最後一個值', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    // 快速連續更新
    rerender({ value: 'update1', delay: 500 })
    rerender({ value: 'update2', delay: 500 })
    rerender({ value: 'update3', delay: 500 })
    rerender({ value: 'final', delay: 500 })

    // 在延遲時間內，值應該還是原始值
    act(() => {
      jest.advanceTimersByTime(400)
    })

    expect(result.current).toBe('initial')

    // 延遲時間結束後，應該是最後一個值
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(result.current).toBe('final')
  })
}) 