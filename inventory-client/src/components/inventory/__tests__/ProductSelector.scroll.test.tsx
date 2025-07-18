import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductSelector } from "../ProductSelector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: 1 } },
    status: "authenticated",
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock API responses
const mockProductsResponse = {
  data: [
    { id: 5, name: "純棉圓領T恤", category_id: 1 },
  ],
};

const mockVariantsResponse = {
  data: {
    id: 5,
    name: "純棉圓領T恤",
    variants: Array.from({ length: 20 }, (_, i) => ({
      id: 100 + i,
      product_id: 5,
      sku: `TSHIRT-COLOR-${i}`,
      price: 299,
      attributes: [
        { name: "顏色", value: `顏色${i}` },
        { name: "尺寸", value: "M" },
      ],
    })),
  },
};

// Mock fetch
global.fetch = jest.fn((url) => {
  if (url.includes("/api/products?")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockProductsResponse),
    });
  }
  if (url.includes("/api/products/5")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVariantsResponse),
    });
  }
  return Promise.reject(new Error("Unknown URL"));
}) as jest.Mock;

describe("ProductSelector Scroll", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("should show scrollbar when content exceeds container height", async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ProductSelector />
        </SessionProvider>
      </QueryClientProvider>
    );

    // 打開選擇器
    const button = screen.getByRole("combobox");
    await user.click(button);

    // 等待產品載入
    await waitFor(() => {
      expect(screen.getByText("純棉圓領T恤")).toBeInTheDocument();
    });

    // 點擊產品
    await user.click(screen.getByText("純棉圓領T恤"));

    // 等待變體載入
    await waitFor(() => {
      expect(screen.getByText("TSHIRT-COLOR-0")).toBeInTheDocument();
    });

    // 檢查 CommandList 元素
    const commandList = screen.getByRole("listbox");
    
    // 檢查計算後的樣式
    const styles = window.getComputedStyle(commandList);
    
    console.log("CommandList computed styles:", {
      maxHeight: styles.maxHeight,
      overflowY: styles.overflowY,
      height: styles.height,
    });

    // 驗證滾動設置
    expect(styles.overflowY).toBe("auto");
    expect(styles.maxHeight).toBe("400px"); // 應該是 400px，而不是 300px
    
    // 檢查內容是否超過容器高度
    const listHeight = commandList.scrollHeight;
    const containerHeight = commandList.clientHeight;
    
    console.log("Scroll dimensions:", {
      scrollHeight: listHeight,
      clientHeight: containerHeight,
      hasScrollbar: listHeight > containerHeight,
    });
    
    expect(listHeight).toBeGreaterThan(containerHeight);
  });
});