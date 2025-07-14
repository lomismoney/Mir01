import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderClientComponent } from "../OrderClientComponent";
import { ProcessedOrder, Order } from "@/types/api-helpers";

/**
 * OrderClientComponent 組件測試
 * 
 * 測試範圍：
 * - 載入狀態顯示
 * - 訂單列表顯示
 * - 搜尋和篩選功能
 * - 分頁功能
 * - 批量操作
 * - 各種 Modal 功能
 * - 錯誤處理
 */

// 模擬 next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// 模擬 hooks
jest.mock("@/hooks", () => ({
  useOrders: jest.fn(),
  useCancelOrder: jest.fn(),
  useBatchDeleteOrders: jest.fn(),
  useBatchUpdateStatus: jest.fn(),
}));

// 模擬 use-debounce
jest.mock("@/hooks/use-debounce", () => ({
  useDebounce: jest.fn((value) => value),
}));

// 模擬 DataTableSkeleton
jest.mock("@/components/ui/data-table-skeleton", () => ({
  DataTableSkeleton: ({ columns }: any) => (
    <div data-testid="data-table-skeleton">
      載入中... ({columns} 列)
    </div>
  ),
}));

// 模擬 sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// 模擬子組件
jest.mock("../OrderPreviewModal", () => ({
  OrderPreviewModal: ({ orderId, open, onOpenChange }: any) => (
    <div data-testid="order-preview-modal" data-open={open} data-order-id={orderId}>
      <button onClick={() => onOpenChange?.(false)}>Close Preview</button>
    </div>
  ),
}));

jest.mock("../ShipmentFormModal", () => ({
  ShipmentFormModal: ({ orderId, open, onOpenChange }: any) => (
    <div data-testid="shipment-form-modal" data-open={open} data-order-id={orderId}>
      <button onClick={() => onOpenChange?.(false)}>Close Shipment</button>
    </div>
  ),
}));

jest.mock("../RecordPaymentModal", () => {
  const MockRecordPaymentModal = ({ order, open, onOpenChange }: any) => (
    <div data-testid="record-payment-modal" data-open={open} data-order-id={order?.id}>
      <button onClick={() => onOpenChange?.(false)}>Close Payment</button>
    </div>
  );
  return MockRecordPaymentModal;
});

jest.mock("../RefundModal", () => {
  const MockRefundModal = ({ order, open, onOpenChange }: any) => (
    <div data-testid="refund-modal" data-open={open} data-order-id={order?.id}>
      <button onClick={() => onOpenChange?.(false)}>Close Refund</button>
    </div>
  );
  return MockRefundModal;
});

jest.mock("../columns", () => ({
  createColumns: ({ onPreview, onShip, onRecordPayment, onRefund, onCancel, onDelete }: any) => [
    {
      id: "select",
      header: ({ table }: any) => (
        <input
          type="checkbox"
          data-testid="select-all-checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        />
      ),
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          data-testid={`select-checkbox-${row.original.id}`}
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
        />
      ),
    },
    {
      id: "order_number",
      header: "訂單號",
      cell: ({ row }: any) => (
        <span data-testid={`order-number-${row.original.id}`}>
          {row.original.order_number}
        </span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }: any) => (
        <div>
          <button
            data-testid={`preview-${row.original.id}`}
            onClick={() => onPreview(row.original.id)}
          >
            預覽
          </button>
          <button
            data-testid={`ship-${row.original.id}`}
            onClick={() => onShip(row.original.id)}
          >
            出貨
          </button>
          <button
            data-testid={`payment-${row.original.id}`}
            onClick={() => onRecordPayment(row.original)}
          >
            付款
          </button>
          <button
            data-testid={`refund-${row.original.id}`}
            onClick={() => onRefund(row.original)}
          >
            退款
          </button>
          <button
            data-testid={`cancel-${row.original.id}`}
            onClick={() => onCancel(row.original)}
          >
            取消
          </button>
          <button
            data-testid={`delete-${row.original.id}`}
            onClick={() => onDelete(row.original.id)}
          >
            刪除
          </button>
        </div>
      ),
    },
  ],
}));

// 取得模擬的 hooks 和函式
const {
  useOrders,
  useCancelOrder,
  useBatchDeleteOrders,
  useBatchUpdateStatus,
} = jest.requireMock<typeof import("@/hooks")>("@/hooks");
const { useRouter } = jest.requireMock<typeof import("next/navigation")>("next/navigation");
const { toast } = jest.requireMock<typeof import("sonner")>("sonner");

describe("OrderClientComponent", () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  // 模擬資料
  const mockOrders = [
    {
      id: 1,
      order_number: "ORD-001",
      customer_name: "張三",
      total_amount: 1000,
      payment_status: "pending",
      shipping_status: "pending",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      order_number: "ORD-002", 
      customer_name: "李四",
      total_amount: 2000,
      payment_status: "paid",
      shipping_status: "shipped",
      created_at: "2024-01-02T00:00:00Z",
    },
  ];

  const mockResponse = {
    data: mockOrders,
    meta: {
      total: 2,
      current_page: 1,
      per_page: 15,
      last_page: 1,
    },
  };

  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  };

  const mockCancelOrder = { mutate: jest.fn() };
  const mockBatchDeleteOrders = { mutate: jest.fn() };
  const mockBatchUpdateStatus = { mutate: jest.fn() };

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // 設定預設 mock 返回值
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useOrders as jest.Mock).mockReturnValue({
      data: mockResponse,
      isLoading: false,
      isError: false,
      error: null,
    });
    (useCancelOrder as jest.Mock).mockReturnValue(mockCancelOrder);
    (useBatchDeleteOrders as jest.Mock).mockReturnValue(mockBatchDeleteOrders);
    (useBatchUpdateStatus as jest.Mock).mockReturnValue(mockBatchUpdateStatus);
  });

  /**
   * 測試載入狀態
   */
  it("應該在載入時顯示載入指示器", () => {
    (useOrders as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<OrderClientComponent />);
    
    // 檢查是否顯示骨架屏
    expect(screen.getByTestId("data-table-skeleton")).toBeInTheDocument();
  });

  /**
   * 測試錯誤狀態
   */
  it("應該正確顯示錯誤訊息", () => {
    (useOrders as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: { message: "Network Error" },
    });

    render(<OrderClientComponent />);
    
    expect(screen.getByText("無法加載訂單資料: Network Error")).toBeInTheDocument();
  });

  /**
   * 測試基本渲染
   */
  it("應該正確渲染訂單管理頁面", () => {
    render(<OrderClientComponent />);
    
    expect(screen.getByPlaceholderText("搜尋訂單號、客戶名稱...")).toBeInTheDocument();
    expect(screen.getByText("新增訂單")).toBeInTheDocument();
    expect(screen.getByText("已選擇 0 筆 / 總計 2 筆")).toBeInTheDocument();
  });

  /**
   * 測試訂單資料顯示
   */
  it("應該正確顯示訂單資料", () => {
    render(<OrderClientComponent />);
    
    expect(screen.getByTestId("order-number-1")).toHaveTextContent("ORD-001");
    expect(screen.getByTestId("order-number-2")).toHaveTextContent("ORD-002");
  });

  /**
   * 測試搜尋功能
   */
  it("應該能夠搜尋訂單", async () => {
    render(<OrderClientComponent />);
    
    const searchInput = screen.getByPlaceholderText("搜尋訂單號、客戶名稱...");
    
    await user.type(searchInput, "ORD-001");
    
    // 檢查 useOrders 是否被正確調用
    expect(useOrders).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "ORD-001",
      })
    );
  });

  /**
   * 測試篩選功能
   */
  it("應該能夠篩選貨物狀態", async () => {
    render(<OrderClientComponent />);
    
    // 找到貨物狀態選擇器（通過 role="combobox" 找到所有選擇器，取第一個）
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[0]);
    
    // 選擇 "已出貨"
    const shippedOption = screen.getByText("已出貨");
    await user.click(shippedOption);
    
    // 檢查 useOrders 是否被正確調用
    expect(useOrders).toHaveBeenCalledWith(
      expect.objectContaining({
        shipping_status: "shipped",
      })
    );
  });

  /**
   * 測試付款狀態篩選
   */
  it("應該能夠篩選付款狀態", async () => {
    render(<OrderClientComponent />);
    
    // 找到付款狀態選擇器（通過 role="combobox" 找到所有選擇器，取第二個）
    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[1]);
    
    // 選擇 "已付款"
    const paidOption = screen.getByText("已付款");
    await user.click(paidOption);
    
    // 檢查 useOrders 是否被正確調用
    expect(useOrders).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_status: "paid",
      })
    );
  });

  /**
   * 測試行選擇功能
   */
  it("應該能夠選擇訂單行", async () => {
    render(<OrderClientComponent />);
    
    // 選擇第一個訂單
    const checkbox1 = screen.getByTestId("select-checkbox-1");
    await user.click(checkbox1);
    
    expect(screen.getByText("已選擇 1 筆 / 總計 2 筆")).toBeInTheDocument();
    
    // 顯示批量操作按鈕
    expect(screen.getByText("批量刪除")).toBeInTheDocument();
    expect(screen.getByText("批量更新狀態")).toBeInTheDocument();
  });

  /**
   * 測試全選功能
   */
  it("應該能夠全選所有訂單", async () => {
    render(<OrderClientComponent />);
    
    const selectAllCheckbox = screen.getByTestId("select-all-checkbox");
    await user.click(selectAllCheckbox);
    
    expect(screen.getByText("已選擇 2 筆 / 總計 2 筆")).toBeInTheDocument();
  });

  /**
   * 測試訂單預覽功能
   */
  it("應該能夠預覽訂單", async () => {
    render(<OrderClientComponent />);
    
    const previewButton = screen.getByTestId("preview-1");
    await user.click(previewButton);
    
    expect(screen.getByTestId("order-preview-modal")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("order-preview-modal")).toHaveAttribute("data-order-id", "1");
  });

  /**
   * 測試出貨功能
   */
  it("應該能夠開啟出貨 Modal", async () => {
    render(<OrderClientComponent />);
    
    const shipButton = screen.getByTestId("ship-1");
    await user.click(shipButton);
    
    expect(screen.getByTestId("shipment-form-modal")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("shipment-form-modal")).toHaveAttribute("data-order-id", "1");
  });

  /**
   * 測試付款功能
   */
  it("應該能夠開啟付款 Modal", async () => {
    render(<OrderClientComponent />);
    
    const paymentButton = screen.getByTestId("payment-1");
    await user.click(paymentButton);
    
    expect(screen.getByTestId("record-payment-modal")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("record-payment-modal")).toHaveAttribute("data-order-id", "1");
  });

  /**
   * 測試退款功能
   */
  it("應該能夠開啟退款 Modal", async () => {
    render(<OrderClientComponent />);
    
    const refundButton = screen.getByTestId("refund-1");
    await user.click(refundButton);
    
    expect(screen.getByTestId("refund-modal")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("refund-modal")).toHaveAttribute("data-order-id", "1");
  });

  /**
   * 測試取消訂單功能
   */
  it("應該能夠取消訂單", async () => {
    render(<OrderClientComponent />);
    
    const cancelButton = screen.getByTestId("cancel-1");
    await user.click(cancelButton);
    
    // 檢查取消確認對話框
    expect(screen.getByText("確認取消訂單？")).toBeInTheDocument();
    
    // 輸入取消原因
    const reasonTextarea = screen.getByPlaceholderText("例如：客戶要求取消...");
    await user.type(reasonTextarea, "客戶要求取消");
    
    // 確認取消
    const confirmButton = screen.getByText("確認取消");
    await user.click(confirmButton);
    
    expect(mockCancelOrder.mutate).toHaveBeenCalledWith(
      { orderId: 1, reason: "客戶要求取消" },
      expect.any(Object)
    );
  });

  /**
   * 測試批量刪除功能
   */
  it("應該能夠批量刪除訂單", async () => {
    render(<OrderClientComponent />);
    
    // 選擇訂單
    const checkbox1 = screen.getByTestId("select-checkbox-1");
    await user.click(checkbox1);
    
    // 點擊批量刪除
    const batchDeleteButton = screen.getByText("批量刪除");
    await user.click(batchDeleteButton);
    
    // 確認刪除
    const confirmButton = screen.getByText("確認執行");
    await user.click(confirmButton);
    
    expect(mockBatchDeleteOrders.mutate).toHaveBeenCalledWith(
      { ids: [1] },
      expect.any(Object)
    );
  });

  /**
   * 測試批量更新狀態功能
   */
  it("應該能夠批量更新付款狀態", async () => {
    render(<OrderClientComponent />);
    
    // 選擇訂單
    const checkbox1 = screen.getByTestId("select-checkbox-1");
    await user.click(checkbox1);
    
    // 點擊批量更新狀態
    const batchUpdateButton = screen.getByText("批量更新狀態");
    await user.click(batchUpdateButton);
    
    // 選擇標記為已付款
    const paidOption = screen.getByText("已付款");
    await user.click(paidOption);
    
    // 確認更新
    const confirmButton = screen.getByText("確認執行");
    await user.click(confirmButton);
    
    expect(mockBatchUpdateStatus.mutate).toHaveBeenCalledWith(
      {
        ids: [1],
        status_type: "payment_status",
        status_value: "paid",
      },
      expect.any(Object)
    );
  });

  /**
   * 測試新增訂單連結
   */
  it("應該包含新增訂單連結", () => {
    render(<OrderClientComponent />);
    
    const addOrderLink = screen.getByText("新增訂單").closest("a");
    expect(addOrderLink).toHaveAttribute("href", "/orders/new");
  });

  /**
   * 測試 Modal 關閉功能
   */
  it("應該能夠關閉 Modal", async () => {
    render(<OrderClientComponent />);
    
    // 開啟預覽 Modal
    const previewButton = screen.getByTestId("preview-1");
    await user.click(previewButton);
    
    // 關閉 Modal
    const closeButton = screen.getByText("Close Preview");
    await user.click(closeButton);
    
    expect(screen.getByTestId("order-preview-modal")).toHaveAttribute("data-open", "false");
  });

  /**
   * 測試空狀態處理
   */
  it("應該處理空訂單列表", () => {
    (useOrders as jest.Mock).mockReturnValue({
      data: { data: [], meta: { total: 0, current_page: 1, per_page: 15, last_page: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<OrderClientComponent />);
    
    expect(screen.getByText("已選擇 0 筆 / 總計 0 筆")).toBeInTheDocument();
  });
}); 