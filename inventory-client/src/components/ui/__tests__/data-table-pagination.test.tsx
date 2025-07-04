import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTablePagination } from "../data-table-pagination";

/**
 * DataTablePagination 組件測試
 * 
 * 測試範圍：
 * - 組件正確渲染
 * - 分頁資訊顯示
 * - 分頁按鈕功能
 * - 頁面大小選擇
 * - 按鈕狀態管理
 * - 邊界情況處理
 */

// 創建模擬的 table 實例
const createMockTable = (pageIndex = 0, pageSize = 10, pageCount = 5, canPreviousPage = true, canNextPage = true) => {
  return {
    getState: () => ({
      pagination: {
        pageIndex,
        pageSize,
      },
    }),
    getPageCount: () => pageCount,
    getFilteredRowModel: () => ({
      rows: Array.from({ length: pageSize }, (_, i) => ({ id: i })),
    }),
    getCanPreviousPage: () => canPreviousPage,
    getCanNextPage: () => canNextPage,
    setPageSize: jest.fn(),
    setPageIndex: jest.fn(),
    previousPage: jest.fn(),
    nextPage: jest.fn(),
  } as any;
};

describe("DataTablePagination", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  /**
   * 測試基本渲染功能
   */
  it("應該正確渲染分頁組件", () => {
    const mockTable = createMockTable();
    render(<DataTablePagination table={mockTable} />);
    
    // 檢查分頁文字存在
    expect(screen.getByText("每頁顯示")).toBeInTheDocument();
    expect(screen.getByText("筆")).toBeInTheDocument();
    expect(screen.getByText(/顯示第/)).toBeInTheDocument();
    expect(screen.getByText(/第 1 頁，共 5 頁/)).toBeInTheDocument();
  });

  /**
   * 測試數據範圍顯示
   */
  it("應該正確顯示數據範圍", () => {
    const mockTable = createMockTable(0, 10, 5);
    render(<DataTablePagination table={mockTable} totalCount={50} />);
    
    // 檢查數據範圍顯示
    expect(screen.getByText("顯示第 1 - 10 筆，共 50 筆")).toBeInTheDocument();
  });

  /**
   * 測試第二頁的數據範圍顯示
   */
  it("應該正確顯示第二頁的數據範圍", () => {
    const mockTable = createMockTable(1, 10, 5);
    render(<DataTablePagination table={mockTable} totalCount={50} />);
    
    // 檢查第二頁的數據範圍
    expect(screen.getByText("顯示第 11 - 20 筆，共 50 筆")).toBeInTheDocument();
    expect(screen.getByText("第 2 頁，共 5 頁")).toBeInTheDocument();
  });

  /**
   * 測試分頁按鈕存在性
   */
  it("應該顯示所有分頁按鈕", () => {
    const mockTable = createMockTable(1, 10, 5);
    render(<DataTablePagination table={mockTable} />);
    
    // 檢查所有分頁按鈕
    expect(screen.getByLabelText("跳到第一頁")).toBeInTheDocument();
    expect(screen.getByLabelText("上一頁")).toBeInTheDocument();
    expect(screen.getByLabelText("下一頁")).toBeInTheDocument();
    expect(screen.getByLabelText("跳到最後一頁")).toBeInTheDocument();
  });

  /**
   * 測試第一頁時按鈕禁用狀態
   */
  it("在第一頁時應該禁用前一頁和第一頁按鈕", () => {
    const mockTable = createMockTable(0, 10, 5, false, true);
    render(<DataTablePagination table={mockTable} />);
    
    // 檢查按鈕禁用狀態
    expect(screen.getByLabelText("跳到第一頁")).toBeDisabled();
    expect(screen.getByLabelText("上一頁")).toBeDisabled();
    expect(screen.getByLabelText("下一頁")).not.toBeDisabled();
    expect(screen.getByLabelText("跳到最後一頁")).not.toBeDisabled();
  });

  /**
   * 測試最後一頁時按鈕禁用狀態
   */
  it("在最後一頁時應該禁用下一頁和最後一頁按鈕", () => {
    const mockTable = createMockTable(4, 10, 5, true, false);
    render(<DataTablePagination table={mockTable} />);
    
    // 檢查按鈕禁用狀態
    expect(screen.getByLabelText("跳到第一頁")).not.toBeDisabled();
    expect(screen.getByLabelText("上一頁")).not.toBeDisabled();
    expect(screen.getByLabelText("下一頁")).toBeDisabled();
    expect(screen.getByLabelText("跳到最後一頁")).toBeDisabled();
  });

  /**
   * 測試上一頁按鈕點擊
   */
  it("點擊上一頁按鈕應該調用 previousPage", async () => {
    const mockTable = createMockTable(1, 10, 5);
    render(<DataTablePagination table={mockTable} />);
    
    const prevButton = screen.getByLabelText("上一頁");
    await user.click(prevButton);
    
    expect(mockTable.previousPage).toHaveBeenCalled();
  });

  /**
   * 測試下一頁按鈕點擊
   */
  it("點擊下一頁按鈕應該調用 nextPage", async () => {
    const mockTable = createMockTable(1, 10, 5);
    render(<DataTablePagination table={mockTable} />);
    
    const nextButton = screen.getByLabelText("下一頁");
    await user.click(nextButton);
    
    expect(mockTable.nextPage).toHaveBeenCalled();
  });

  /**
   * 測試跳到第一頁按鈕點擊
   */
  it("點擊跳到第一頁按鈕應該調用 setPageIndex(0)", async () => {
    const mockTable = createMockTable(2, 10, 5);
    render(<DataTablePagination table={mockTable} />);
    
    const firstButton = screen.getByLabelText("跳到第一頁");
    await user.click(firstButton);
    
    expect(mockTable.setPageIndex).toHaveBeenCalledWith(0);
  });

  /**
   * 測試跳到最後一頁按鈕點擊
   */
  it("點擊跳到最後一頁按鈕應該調用 setPageIndex(pageCount - 1)", async () => {
    const mockTable = createMockTable(1, 10, 5);
    render(<DataTablePagination table={mockTable} />);
    
    const lastButton = screen.getByLabelText("跳到最後一頁");
    await user.click(lastButton);
    
    expect(mockTable.setPageIndex).toHaveBeenCalledWith(4);
  });

  /**
   * 測試頁面大小選擇器
   */
  it("應該正確顯示頁面大小選擇器", () => {
    const mockTable = createMockTable();
    render(<DataTablePagination table={mockTable} />);
    
    // 檢查當前頁面大小顯示（在 select 觸發器中）
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  /**
   * 測試自定義頁面大小選項
   */
  it("應該支援自定義頁面大小選項", async () => {
    const mockTable = createMockTable();
    const customOptions = [5, 10, 25, 50];
    
    render(
      <DataTablePagination 
        table={mockTable} 
        pageSizeOptions={customOptions} 
      />
    );
    
    // 點擊選擇器打開下拉選單
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    
    // 檢查自定義選項是否存在
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  /**
   * 測試頁面大小變更
   */
  it("變更頁面大小應該調用 setPageSize", async () => {
    const mockTable = createMockTable();
    render(<DataTablePagination table={mockTable} />);
    
    // 點擊選擇器
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    
    // 選擇新的頁面大小
    const option20 = screen.getByText("20");
    await user.click(option20);
    
    expect(mockTable.setPageSize).toHaveBeenCalledWith(20);
  });

  /**
   * 測試無 totalCount 時的行為
   */
  it("沒有 totalCount 時應該使用 filtered rows 長度", () => {
    const mockTable = createMockTable();
    render(<DataTablePagination table={mockTable} />);
    
    // 應該顯示 filtered rows 的數量
    expect(screen.getByText("顯示第 1 - 10 筆，共 10 筆")).toBeInTheDocument();
  });

  /**
   * 測試組件快照
   */
  it("應該匹配快照", () => {
    const mockTable = createMockTable();
    const { container } = render(<DataTablePagination table={mockTable} />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 