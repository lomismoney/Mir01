import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../use-toast';

// 直接導入 dispatch 函數來清理狀態
declare const dispatch: (action: any) => void;

/**
 * Toast 系統測試套件
 *
 * 測試範圍：
 * - useToast hook 的基本功能
 * - toast 函數的操作
 * - reducer 的狀態管理
 * - 自動移除機制
 * - 錯誤處理
 */
describe('Toast 系統測試', () => {
  // 清理定時器和狀態
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('useToast Hook', () => {
    it('應該返回初始的空狀態', () => {
      const { result } = renderHook(() => useToast());
      
      expect(result.current.toasts).toEqual([]);
      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('應該能夠添加新的 toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: '測試標題',
          description: '測試描述',
        });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('測試標題');
      expect(result.current.toasts[0].description).toBe('測試描述');
      expect(result.current.toasts[0].open).toBe(true);
    });

    it('應該能夠關閉特定的 toast', () => {
      const { result } = renderHook(() => useToast());
      
      let toastId: string;
      const initialLength = result.current.toasts.length;
      
      act(() => {
        const toastResult = result.current.toast({
          title: '測試 Toast',
        });
        toastId = toastResult.id;
      });
      
      expect(result.current.toasts).toHaveLength(initialLength + 1);
      const ourToast = result.current.toasts.find(t => t.id === toastId);
      expect(ourToast?.open).toBe(true);
      
      act(() => {
        result.current.dismiss(toastId);
      });
      
      const closedToast = result.current.toasts.find(t => t.id === toastId);
      expect(closedToast?.open).toBe(false);
    });

    it('應該能夠關閉所有 toast', () => {
      const { result } = renderHook(() => useToast());
      
      const initialLength = result.current.toasts.length;
      let testToastIds: string[] = [];
      
      act(() => {
        testToastIds.push(result.current.toast({ title: 'Toast 1' }).id);
        testToastIds.push(result.current.toast({ title: 'Toast 2' }).id);
        testToastIds.push(result.current.toast({ title: 'Toast 3' }).id);
      });
      
      expect(result.current.toasts).toHaveLength(initialLength + 3);
      const testToasts = result.current.toasts.filter(t => testToastIds.includes(t.id));
      expect(testToasts.every(t => t.open)).toBe(true);
      
      act(() => {
        result.current.dismiss();
      });
      
      const allToasts = result.current.toasts;
      expect(allToasts.every(t => !t.open)).toBe(true);
    });

    it('應該限制 toast 數量', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.toast({ title: `Toast ${i}` });
        }
      });
      
      // 應該只保留最後 5 個 toast
      expect(result.current.toasts).toHaveLength(5);
      expect(result.current.toasts[0].title).toBe('Toast 9');
      expect(result.current.toasts[4].title).toBe('Toast 5');
    });

    it('toast 函數應該返回控制方法', () => {
      const { result } = renderHook(() => useToast());
      
      let toastControl: any;
      
      act(() => {
        toastControl = result.current.toast({
          title: '可控制的 Toast',
        });
      });
      
      expect(toastControl).toHaveProperty('id');
      expect(toastControl).toHaveProperty('dismiss');
      expect(toastControl).toHaveProperty('update');
      expect(typeof toastControl.dismiss).toBe('function');
      expect(typeof toastControl.update).toBe('function');
    });

    it('應該能夠更新現有的 toast', () => {
      const { result } = renderHook(() => useToast());
      
      let toastControl: any;
      
      act(() => {
        toastControl = result.current.toast({
          title: '原始標題',
          description: '原始描述',
        });
      });
      
      expect(result.current.toasts[0].title).toBe('原始標題');
      
      act(() => {
        toastControl.update({
          title: '更新的標題',
          description: '更新的描述',
        });
      });
      
      expect(result.current.toasts[0].title).toBe('更新的標題');
      expect(result.current.toasts[0].description).toBe('更新的描述');
    });

    it('toast 的 onOpenChange 應該能關閉 toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: '測試 Toast',
        });
      });
      
      expect(result.current.toasts[0].open).toBe(true);
      
      act(() => {
        result.current.toasts[0].onOpenChange?.(false);
      });
      
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('應該支援不同的 toast 變體', () => {
      const { result } = renderHook(() => useToast());
      
      let toastIds: string[] = [];
      
      act(() => {
        toastIds.push(result.current.toast({
          title: '成功訊息',
          variant: 'default',
        }).id);
        
        toastIds.push(result.current.toast({
          title: '錯誤訊息',
          variant: 'destructive',
        }).id);
      });
      
      const testToasts = result.current.toasts.filter(t => toastIds.includes(t.id));
      expect(testToasts).toHaveLength(2);
      
      const destructiveToast = testToasts.find(t => t.variant === 'destructive');
      const defaultToast = testToasts.find(t => t.variant === 'default');
      
      expect(destructiveToast).toBeDefined();
      expect(defaultToast).toBeDefined();
    });
  });

  describe('toast 函數', () => {
    it('應該返回帶有 id、dismiss 和 update 方法的物件', () => {
      let result: ReturnType<typeof toast>;
      act(() => {
        result = toast({ title: '測試' });
      });
      
      expect(result!).toHaveProperty('id');
      expect(result!).toHaveProperty('dismiss');
      expect(result!).toHaveProperty('update');
      expect(typeof result!.id).toBe('string');
      expect(typeof result!.dismiss).toBe('function');
      expect(typeof result!.update).toBe('function');
    });

    it('應該能夠通過返回的 dismiss 方法關閉 toast', () => {
      const { result } = renderHook(() => useToast());
      
      let toastResult: ReturnType<typeof toast>;
      act(() => {
        toastResult = toast({ title: '測試' });
      });

      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        toastResult.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('應該為每個 toast 生成唯一的 ID', () => {
      let toast1: ReturnType<typeof toast>;
      let toast2: ReturnType<typeof toast>;
      let toast3: ReturnType<typeof toast>;
      
      act(() => {
        toast1 = toast({ title: 'Toast 1' });
        toast2 = toast({ title: 'Toast 2' });
        toast3 = toast({ title: 'Toast 3' });
      });

      expect(toast1!.id).not.toBe(toast2!.id);
      expect(toast2!.id).not.toBe(toast3!.id);
      expect(toast1!.id).not.toBe(toast3!.id);
    });
  });

  describe('reducer', () => {
    const initialState = { toasts: [] };

    it('應該處理 ADD_TOAST action', () => {
      const newToast = {
        id: '1',
        title: '測試 toast',
        open: true,
      };

      const newState = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(newToast);
    });

    it('應該處理 UPDATE_TOAST action', () => {
      const existingState = {
        toasts: [
          { id: '1', title: '原始標題', open: true },
          { id: '2', title: '其他 toast', open: true },
        ],
      };

      const newState = reducer(existingState, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: '更新後標題', description: '新描述' },
      });

      expect(newState.toasts[0].title).toBe('更新後標題');
      expect(newState.toasts[0].description).toBe('新描述');
      expect(newState.toasts[1].title).toBe('其他 toast'); // 其他 toast 不受影響
    });

    it('應該處理 DISMISS_TOAST action（特定 toast）', () => {
      const existingState = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ],
      };

      const newState = reducer(existingState, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(true); // 其他 toast 不受影響
    });

    it('應該處理 DISMISS_TOAST action（所有 toast）', () => {
      const existingState = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ],
      };

      const newState = reducer(existingState, {
        type: 'DISMISS_TOAST',
        // 不提供 toastId
      });

      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(false);
    });

    it('應該處理 REMOVE_TOAST action（特定 toast）', () => {
      const existingState = {
        toasts: [
          { id: '1', title: 'Toast 1', open: false },
          { id: '2', title: 'Toast 2', open: true },
        ],
      };

      const newState = reducer(existingState, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('2');
    });

    it('應該處理 REMOVE_TOAST action（所有 toast）', () => {
      const existingState = {
        toasts: [
          { id: '1', title: 'Toast 1', open: false },
          { id: '2', title: 'Toast 2', open: false },
        ],
      };

      const newState = reducer(existingState, {
        type: 'REMOVE_TOAST',
        // 不提供 toastId
      });

      expect(newState.toasts).toHaveLength(0);
    });
  });

  describe('自動移除機制', () => {
    it('應該在指定時間後自動移除已關閉的 toast', () => {
      const { result } = renderHook(() => useToast());
      
      let toastId: string;
      const initialToastCount = result.current.toasts.length;
      
      act(() => {
        const toastResult = result.current.toast({ title: '測試自動移除 toast' });
        toastId = toastResult.id;
      });

      // 關閉 toast
      act(() => {
        result.current.dismiss(toastId);
      });

      // 找到我們的測試 toast
      const testToast = result.current.toasts.find(t => t.title === '測試自動移除 toast');
      expect(testToast?.open).toBe(false);

      // 快進時間到移除延遲
      act(() => {
        jest.advanceTimersByTime(1000000); // TOAST_REMOVE_DELAY
      });

      // 檢查我們的測試 toast 是否被移除
      const remainingTestToast = result.current.toasts.find(t => t.title === '測試自動移除 toast');
      expect(remainingTestToast).toBeUndefined();
    });
  });

  describe('onOpenChange 回調', () => {
    it('應該在 onOpenChange 被調用時關閉 toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: '測試 toast' });
      });

      const currentToast = result.current.toasts[0];
      expect(currentToast.open).toBe(true);

      // 模擬 onOpenChange 被調用
      act(() => {
        if (currentToast.onOpenChange) {
          currentToast.onOpenChange(false);
        }
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('複雜場景測試', () => {
    it('應該正確處理快速連續的 toast 操作', () => {
      const { result } = renderHook(() => useToast());
      
      let firstToastId: string;
      
      act(() => {
        // 快速添加多個 toast
        result.current.toast({ title: '連續測試 Toast 1' });
        result.current.toast({ title: '連續測試 Toast 2' });
        const thirdToast = result.current.toast({ title: '連續測試 Toast 3' });
        firstToastId = thirdToast.id; // 最新的會是第一個
      });

      // 找到我們的測試 toasts
      const testToasts = result.current.toasts.filter(t =>
        t.title?.includes('連續測試')
      );
      expect(testToasts.length).toBeGreaterThanOrEqual(3);

      act(() => {
        // 關閉最新的 toast
        result.current.dismiss(firstToastId);
      });

      // 檢查被關閉的 toast
      const closedToast = result.current.toasts.find(t => t.id === firstToastId);
      expect(closedToast?.open).toBe(false);
      
      // 檢查其他 toast 仍然開啟
      const otherTestToasts = result.current.toasts.filter(t =>
        t.title?.includes('連續測試') && t.id !== firstToastId
      );
      expect(otherTestToasts.every(t => t.open)).toBe(true);
    });

    it('應該正確處理帶有 action 的 toast', () => {
      const { result } = renderHook(() => useToast());
      const mockAction = { 
        altText: '取消',
        onClick: jest.fn() 
      } as any;
      
      act(() => {
        result.current.toast({
          title: '確認操作',
          description: '請確認是否要執行此操作',
          action: mockAction,
        });
      });

      expect(result.current.toasts[0].action).toBe(mockAction);
    });
  });
});