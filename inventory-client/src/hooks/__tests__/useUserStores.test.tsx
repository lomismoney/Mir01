/**
 * @file useUserStores Hook 測試
 * @description 測試用戶分店關聯相關的 React Query hooks
 */

import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import apiClient from "@/lib/apiClient";
import { handleApiError } from "@/lib/errorHandler";
import { useUserStores, useAssignUserStores } from "../useUserStores";

// Mock dependencies
jest.mock("@/lib/apiClient");
jest.mock("@/lib/errorHandler");

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedHandleApiError = handleApiError as jest.MockedFunction<typeof handleApiError>;

/**
 * 創建測試用的 QueryClient
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * 測試用的 wrapper 組件
 */
const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/**
 * 模擬分店數據
 */
const mockStore = {
  id: 1,
  name: "測試分店",
  address: "測試地址",
  phone: "123-456-7890",
  status: "active",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  inventory_count: 100,
  users_count: 5,
};

const mockUserStores = [
  mockStore,
  {
    id: 2,
    name: "測試分店2",
    address: "測試地址2",
    phone: "123-456-7891",
    status: "active",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    inventory_count: 150,
    users_count: 8,
  },
];

describe("useUserStores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useUserStores", () => {
    it("應該成功獲取用戶分店列表", async () => {
      // 模擬 API 成功回應
      mockedApiClient.GET.mockResolvedValue({
        data: { data: mockUserStores },
        error: undefined,
      } as any);

      const { result } = renderHook(() => useUserStores(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: mockUserStores });
      expect(mockedApiClient.GET).toHaveBeenCalledWith(
        "/api/users/{user_id}/stores",
        {
          params: { path: { user_id: 1 } },
        }
      );
    });

    it("應該處理 API 錯誤", async () => {
      const mockError = { message: "用戶不存在" };
      mockedApiClient.GET.mockResolvedValue({
        data: undefined,
        error: mockError,
      } as any);

      mockedHandleApiError.mockImplementation(() => {
        return "處理後的錯誤訊息";
      });

      const { result } = renderHook(() => useUserStores(999), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockedHandleApiError).toHaveBeenCalledWith(mockError);
      expect(result.current.error).toEqual(new Error("取得用戶門市失敗"));
    });

    it("當 userId 為 0 時應該禁用查詢", () => {
      const { result } = renderHook(() => useUserStores(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockedApiClient.GET).not.toHaveBeenCalled();
    });

    it("應該處理空數據回應", async () => {
      mockedApiClient.GET.mockResolvedValue({
        data: null,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useUserStores(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: [] });
    });

    it("應該處理無嵌套 data 的回應", async () => {
      mockedApiClient.GET.mockResolvedValue({
        data: mockUserStores,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useUserStores(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: mockUserStores });
    });
  });

  describe("useAssignUserStores", () => {
    it("應該成功分配分店給用戶", async () => {
      const assignData = { userId: 1, storeIds: [1, 2] };
      const responseData = { success: true };

      mockedApiClient.POST.mockResolvedValue({
        data: responseData,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useAssignUserStores(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(assignData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(responseData);
      expect(mockedApiClient.POST).toHaveBeenCalledWith(
        "/api/users/{user_id}/stores",
        {
          params: { path: { user_id: 1 } },
          body: { store_ids: [1, 2] },
        }
      );
    });

    it("應該處理分配錯誤", async () => {
      const assignData = { userId: 1, storeIds: [1] };
      const mockError = { message: "權限不足" };

      mockedApiClient.POST.mockResolvedValue({
        data: undefined,
        error: mockError,
      } as any);

      mockedHandleApiError.mockImplementation(() => {
        return "處理後的錯誤訊息";
      });

      const { result } = renderHook(() => useAssignUserStores(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(assignData);
        } catch (error) {
          expect(error).toEqual(new Error("分配門市失敗"));
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      
      expect(mockedHandleApiError).toHaveBeenCalledWith(mockError);
    });

    it("應該處理空分店 ID 陣列", async () => {
      const assignData = { userId: 1, storeIds: [] };
      const responseData = { success: true };

      mockedApiClient.POST.mockResolvedValue({
        data: responseData,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useAssignUserStores(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(assignData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedApiClient.POST).toHaveBeenCalledWith(
        "/api/users/{user_id}/stores",
        {
          params: { path: { user_id: 1 } },
          body: { store_ids: [] },
        }
      );
    });
  });
}); 