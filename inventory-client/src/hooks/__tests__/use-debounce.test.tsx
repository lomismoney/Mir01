/**
 * useDebounce Hook 測試套件
 * 
 * 這個測試套件涵蓋了：
 * - useDebounce hook 的基本防抖功能
 * - 不同資料類型的防抖處理
 * - 延遲時間的正確性驗證
 * - 快速變化值的處理
 * - 邊界條件和效能測試
 * - 清理功能驗證
 */

import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

// Mock timers for precise timing control
jest.useFakeTimers();

describe('useDebounce', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('基本防抖功能', () => {
    /**
     * 測試基本防抖行為
     */
    it('應該在延遲時間後返回最新值', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 },
        }
      );

      // 初始值應該立即可用
      expect(result.current).toBe('initial');

      // 更新值
      rerender({ value: 'updated', delay: 500 });

      // 值應該還沒有更新（在延遲期間內）
      expect(result.current).toBe('initial');

      // 快進到延遲時間
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // 值應該已經更新
      expect(result.current).toBe('updated');
    });

    /**
     * 測試快速連續更新
     */
    it('應該只保留最後一次更新的值', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'first', delay: 300 },
        }
      );

      expect(result.current).toBe('first');

      // 快速連續更新
      rerender({ value: 'second', delay: 300 });
      rerender({ value: 'third', delay: 300 });
      rerender({ value: 'fourth', delay: 300 });

      // 在延遲期間內，值應該保持為初始值
      expect(result.current).toBe('first');

      // 快進到延遲時間
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 應該只有最後一次更新的值被保留
      expect(result.current).toBe('fourth');
    });

    /**
     * 測試延遲時間為 0 的情況
     */
    it('應該在延遲時間為 0 時立即更新', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 0 },
        }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'immediate', delay: 0 });

      // 即使延遲為 0，也需要等待下一個 tick
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('immediate');
    });
  });

  describe('不同資料類型測試', () => {
    /**
     * 測試字串類型
     */
    it('應該正確處理字串類型', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: '', delay: 200 },
        }
      );

      expect(result.current).toBe('');

      rerender({ value: 'hello world', delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe('hello world');
    });

    /**
     * 測試數字類型
     */
    it('應該正確處理數字類型', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 0, delay: 150 },
        }
      );

      expect(result.current).toBe(0);

      rerender({ value: 42, delay: 150 });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current).toBe(42);
    });

    /**
     * 測試布林類型
     */
    it('應該正確處理布林類型', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: false, delay: 100 },
        }
      );

      expect(result.current).toBe(false);

      rerender({ value: true, delay: 100 });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(true);
    });

    /**
     * 測試陣列類型
     */
    it('應該正確處理陣列類型', () => {
      const initialArray = [1, 2, 3];
      const updatedArray = [4, 5, 6];

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: initialArray, delay: 250 },
        }
      );

      expect(result.current).toEqual([1, 2, 3]);

      rerender({ value: updatedArray, delay: 250 });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(result.current).toEqual([4, 5, 6]);
    });

    /**
     * 測試物件類型
     */
    it('應該正確處理物件類型', () => {
      const initialObj = { name: 'John', age: 30 };
      const updatedObj = { name: 'Jane', age: 25 };

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: initialObj, delay: 200 },
        }
      );

      expect(result.current).toEqual({ name: 'John', age: 30 });

      rerender({ value: updatedObj, delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toEqual({ name: 'Jane', age: 25 });
    });

    /**
     * 測試 null 和 undefined
     */
    it('應該正確處理 null 和 undefined', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }: { value: null | undefined; delay: number }) => useDebounce(value, delay),
        {
          initialProps: { value: null, delay: 100 },
        }
      );

      expect(result.current).toBeNull();

      rerender({ value: undefined, delay: 100 });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBeUndefined();
    });
  });

  describe('延遲時間測試', () => {
    /**
     * 測試不同的延遲時間
     */
    it('應該支援不同的延遲時間', () => {
      const delays = [50, 100, 500, 1000];

      delays.forEach(delay => {
        const { result, rerender } = renderHook(
          ({ value, delay }) => useDebounce(value, delay),
          {
            initialProps: { value: 'initial', delay },
          }
        );

        rerender({ value: `updated-${delay}`, delay });

        // 在延遲時間之前，值不應該更新
        act(() => {
          jest.advanceTimersByTime(delay - 1);
        });
        expect(result.current).toBe('initial');

        // 在延遲時間後，值應該更新
        act(() => {
          jest.advanceTimersByTime(1);
        });
        expect(result.current).toBe(`updated-${delay}`);
      });
    });

    /**
     * 測試動態變更延遲時間
     */
    it('應該支援動態變更延遲時間', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'test', delay: 300 },
        }
      );

      // 更新值和延遲時間
      rerender({ value: 'updated', delay: 100 });

      // 使用新的延遲時間
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe('updated');
    });
  });

  describe('計時器清理測試', () => {
    /**
     * 測試組件卸載時的計時器清理
     */
    it('應該在組件卸載時清理計時器', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 },
        }
      );

      rerender({ value: 'updated', delay: 500 });

      // 卸載組件
      unmount();

      // 應該調用 clearTimeout
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    /**
     * 測試快速更新時的計時器清理
     */
    it('應該在快速更新時清理舊的計時器', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'first', delay: 500 },
        }
      );

      // 快速連續更新
      rerender({ value: 'second', delay: 500 });
      rerender({ value: 'third', delay: 500 });

      // 每次更新都應該清理前一個計時器
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('邊界條件和效能測試', () => {
    /**
     * 測試極短延遲時間
     */
    it('應該處理極短的延遲時間', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 1 },
        }
      );

      rerender({ value: 'updated', delay: 1 });

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current).toBe('updated');
    });

    /**
     * 測試極長延遲時間
     */
    it('應該處理極長的延遲時間', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 10000 },
        }
      );

      rerender({ value: 'updated', delay: 10000 });

      // 在延遲時間之前
      act(() => {
        jest.advanceTimersByTime(9999);
      });
      expect(result.current).toBe('initial');

      // 在延遲時間後
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    });

    /**
     * 測試大量快速更新的效能
     */
    it('應該有效處理大量快速更新', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 0, delay: 100 },
        }
      );

      // 大量快速更新
      for (let i = 1; i <= 1000; i++) {
        rerender({ value: i, delay: 100 });
      }

      // 應該仍然保持初始值
      expect(result.current).toBe(0);

      // 延遲後應該只有最後一次更新生效
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(1000);
    });

    /**
     * 測試特殊字符處理
     */
    it('應該正確處理包含特殊字符的字串', () => {
      const specialChars = 'Hello 世界 & <script>alert("test")</script> 🚀';

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: '', delay: 200 },
        }
      );

      rerender({ value: specialChars, delay: 200 });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(specialChars);
    });

    /**
     * 測試深層物件防抖
     */
    it('應該正確處理深層巢狀物件', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              data: 'deep value',
              array: [1, 2, { nested: true }],
            },
          },
        },
      };

      const { result, rerender } = renderHook(
        ({ value, delay }: { value: any; delay: number }) => useDebounce(value, delay),
        {
          initialProps: { value: null as any, delay: 150 },
        }
      );

      rerender({ value: deepObject, delay: 150 });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current).toEqual(deepObject);
    });
  });

  describe('實際使用場景測試', () => {
    /**
     * 測試搜尋輸入框場景
     */
    it('應該適用於搜尋輸入框的防抖', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: '', delay: 500 },
        }
      );

      // 模擬用戶快速輸入
      const searchSequence = ['r', 're', 'rea', 'reac', 'react'];

      searchSequence.forEach(search => {
        rerender({ value: search, delay: 500 });
      });

      // 在延遲期間內，搜尋值應該保持為空
      expect(result.current).toBe('');

      // 延遲後，應該只觸發最後一次搜尋
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('react');
    });

    /**
     * 測試 API 請求節流場景
     */
    it('應該適用於 API 請求節流', () => {
      let apiCallCount = 0;
      const mockApiCall = jest.fn(() => {
        apiCallCount++;
      });

      const { result, rerender } = renderHook(
        ({ value, delay }) => {
          const debouncedValue = useDebounce(value, delay);
          
          // 模擬當 debouncedValue 變化時調用 API
          if (debouncedValue && debouncedValue !== '') {
            mockApiCall();
          }
          
          return debouncedValue;
        },
        {
          initialProps: { value: '', delay: 300 },
        }
      );

      // 快速變更查詢條件
      rerender({ value: 'query1', delay: 300 });
      rerender({ value: 'query2', delay: 300 });
      rerender({ value: 'query3', delay: 300 });

      // API 尚未被調用
      expect(mockApiCall).not.toHaveBeenCalled();

      // 延遲後，API 應該只被調用一次
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(result.current).toBe('query3');
    });
  });
});