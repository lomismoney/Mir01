import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { safeApiClient } from "@/lib/apiClient";

export interface GlobalSearchResult {
  products: Array<{
    id: number;
    name: string;
    sku: string;
    price: string;
    stock: number;
    image_url: string | null;
  }>;
  orders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    total_amount: string;
    status: string;
    created_at: string;
  }>;
  customers: Array<{
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    total_orders: number;
    total_spent: string;
  }>;
}

export function useGlobalSearch(query: string, limit = 5) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["global-search", debouncedQuery, limit],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return {
          products: [],
          orders: [],
          customers: [],
        };
      }

      const response = await safeApiClient.POST("/api/search/global", {
        body: {
          query: debouncedQuery,
          limit,
        },
      });

      if (response.error) {
        throw new Error("搜索失敗");
      }

      return response.data as GlobalSearchResult;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // 30 秒內不重新請求
  });
}