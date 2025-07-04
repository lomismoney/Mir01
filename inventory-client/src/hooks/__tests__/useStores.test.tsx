/**
 * @file useStores Hook 測試
 * @description 測試分店相關的 React Query hooks
 */

import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import apiClient from "@/lib/apiClient";
import { handleApiError } from "@/lib/errorHandler";
import {
  useStores,
  useStore,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
  Store,
} from "../useStores";

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
const mockStore: Store = {
  id: 1,
  name: "測試分店",
  address: "測試地址",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

const mockStores: Store[] = [
  mockStore,
  {
    id: 2,
    name: "測試分店2",
    address: "測試地址2",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
];

describe("useStores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useStores", () => {
    it("應該成功獲取分店列表", async () => {
      // 模擬 API 成功回應
      mockedApiClient.GET.mockResolvedValue({
        data: { data: mockStores },
        error: undefined,
      } as any);

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: mockStores });
      expect(mockedApiClient.GET).toHaveBeenCalledWith("/api/stores");
    });

    it("應該處理 API 錯誤", async () => {
      const mockError = { message: "API 錯誤" };
      mockedApiClient.GET.mockResolvedValue({
        data: undefined,
        error: mockError,
      } as any);

      mockedHandleApiError.mockImplementation(() => {
        throw new Error("處理後的錯誤");
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockedHandleApiError).toHaveBeenCalledWith(mockError);
    });

    it("應該處理空數據回應", async () => {
      mockedApiClient.GET.mockResolvedValue({
        data: null,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: [] });
    });

    it("應該處理無嵌套 data 的回應", async () => {
      mockedApiClient.GET.mockResolvedValue({
        data: mockStores,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: mockStores });
    });
  });

  describe("useStore", () => {
    it("應該成功獲取單個分店", async () => {
      mockedApiClient.GET.mockResolvedValue({
        data: { data: mockStore },
        error: undefined,
      } as any);

      const { result } = renderHook(() => useStore(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: mockStore });
      expect(mockedApiClient.GET).toHaveBeenCalledWith(
        "/api/stores/{store}",
        { params: { path: { store: 1 } } }
      );
    });

    it("應該處理 API 錯誤", async () => {
      mockedApiClient.GET.mockResolvedValue({
        data: undefined,
        error: { message: "分店不存在" },
      } as any);

      const { result } = renderHook(() => useStore(999), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error("取得門市詳情失敗"));
    });

    it("當 ID 為 0 時應該禁用查詢", () => {
      const { result } = renderHook(() => useStore(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(mockedApiClient.GET).not.toHaveBeenCalled();
    });

    it("應該處理無嵌套 data 的回應", async () => {
      mockedApiClient.GET.mockResolvedValue({
        data: mockStore,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useStore(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: mockStore });
    });
  });

  describe("useCreateStore", () => {
    it("應該成功創建分店", async () => {
      const createData = { name: "新分店", address: "新地址" };
      const responseData = { data: mockStore };

      mockedApiClient.POST.mockResolvedValue({
        data: responseData,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useCreateStore(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(createData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(responseData);
      expect(mockedApiClient.POST).toHaveBeenCalledWith("/api/stores", {
        body: createData,
      });
    });

    it("應該處理創建錯誤", async () => {
      const createData = { name: "新分店" };
      mockedApiClient.POST.mockResolvedValue({
        data: undefined,
        error: { message: "驗證失敗" },
      } as any);

      const { result } = renderHook(() => useCreateStore(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(createData);
        } catch (error) {
          expect(error).toEqual(new Error("新增門市失敗"));
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useUpdateStore", () => {
    it("應該成功更新分店", async () => {
      const updateData = { name: "更新的分店", address: "更新的地址" };
      const responseData = { data: { ...mockStore, ...updateData } };

      mockedApiClient.PUT.mockResolvedValue({
        data: responseData,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useUpdateStore(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 1, data: updateData });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(responseData);
      expect(mockedApiClient.PUT).toHaveBeenCalledWith("/api/stores/{store}", {
        params: { path: { store: 1 } },
        body: updateData,
      });
    });

    it("應該處理更新錯誤", async () => {
      const updateData = { name: "更新的分店" };
      mockedApiClient.PUT.mockResolvedValue({
        data: undefined,
        error: { message: "更新失敗" },
      } as any);

      const { result } = renderHook(() => useUpdateStore(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ id: 1, data: updateData });
        } catch (error) {
          expect(error).toEqual(new Error("更新門市失敗"));
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useDeleteStore", () => {
    it("應該成功刪除分店", async () => {
      mockedApiClient.DELETE.mockResolvedValue({
        data: undefined,
        error: undefined,
      } as any);

      const { result } = renderHook(() => useDeleteStore(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(1);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ success: true });
      expect(mockedApiClient.DELETE).toHaveBeenCalledWith("/api/stores/{store}", {
        params: { path: { store: 1 } },
      });
    });

    it("應該處理刪除錯誤", async () => {
      const mockError = { message: "刪除失敗" };
      mockedApiClient.DELETE.mockResolvedValue({
        data: undefined,
        error: mockError,
      } as any);

      mockedHandleApiError.mockImplementation(() => {
        throw new Error("處理後的錯誤");
      });

      const { result } = renderHook(() => useDeleteStore(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(1);
        } catch (error) {
          expect(error).toEqual(new Error("處理後的錯誤"));
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      
      expect(mockedHandleApiError).toHaveBeenCalledWith(mockError);
    });
  });
}); 