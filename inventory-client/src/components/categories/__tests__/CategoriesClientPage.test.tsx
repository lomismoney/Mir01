import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoriesClientPage } from "../CategoriesClientPage";
import { type CategoryNode } from "@/hooks";

/**
 * CategoriesClientPage 組件測試
 * 
 * 測試範圍：
 * - 載入狀態顯示
 * - 分類列表顯示
 * - 搜尋功能
 * - 新增分類功能
 * - 編輯分類功能
 * - 刪除分類功能
 * - 欄位顯示控制
 * - 子分類操作
 */

// 模擬 next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// 模擬 hooks
jest.mock("@/hooks", () => ({
  useCategories: jest.fn(),
  useDeleteCategory: jest.fn(),
}));

// 模擬 sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// 模擬子組件
const renderCategoriesRecursive = (categories: CategoryNode[], columns: any[]) => {
  const result: any[] = [];
  categories.forEach(category => {
    result.push(
      <div key={category.id} data-testid={`category-${category.id}`}>
        {category.name}
        {columns?.[0]?.cell?.({ row: { original: category } })}
      </div>
    );
    if (category.children && category.children.length > 0) {
      result.push(...renderCategoriesRecursive(category.children, columns));
    }
  });
  return result;
};

jest.mock("../DraggableCategoriesTable", () => ({
  DraggableCategoriesTable: ({ data, isLoading, columns, ...props }: any) => (
    <div data-testid="draggable-categories-table" data-loading={isLoading}>
      {renderCategoriesRecursive(data, columns)}
    </div>
  ),
}));

jest.mock("../CreateCategoryModal", () => ({
  CreateCategoryModal: ({ open, onSuccess, parentCategory, ...props }: any) => (
    <div data-testid="create-category-modal" data-open={open}>
      <button onClick={() => onSuccess?.()}>Create Success</button>
      {parentCategory && (
        <div data-testid="parent-category">{parentCategory.name}</div>
      )}
    </div>
  ),
}));

jest.mock("../UpdateCategoryModal", () => ({
  UpdateCategoryModal: ({ open, onSuccess, category, ...props }: any) => (
    <div data-testid="update-category-modal" data-open={open}>
      <button onClick={() => onSuccess?.()}>Update Success</button>
      {category && (
        <div data-testid="editing-category">{category.name}</div>
      )}
    </div>
  ),
}));

jest.mock("../categories-columns", () => ({
  createCategoryColumns: ({ onAddSubCategory, onEdit, onDelete }: any) => [
    {
      id: "name",
      header: "Name",
      cell: ({ row }: any) => (
        <div>
          <span>{row.original.name}</span>
          <button
            data-testid={`add-sub-${row.original.id}`}
            onClick={() => onAddSubCategory(row.original.id)}
          >
            Add Sub
          </button>
          <button
            data-testid={`edit-${row.original.id}`}
            onClick={() => onEdit(row.original)}
          >
            Edit
          </button>
          <button
            data-testid={`delete-${row.original.id}`}
            onClick={() => onDelete(row.original)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ],
}));

// 取得模擬的 hooks 和函式
const { useCategories, useDeleteCategory } = require("@/hooks");
const { useRouter } = require("next/navigation");
const { toast } = require("sonner");

describe("CategoriesClientPage", () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  // 模擬資料
  const mockCategories: CategoryNode[] = [
    {
      id: 1,
      name: "電子產品",
      description: "電子產品分類",
      parent_id: null,
      sort_order: 1,
      products_count: 5,
      children: [
        {
          id: 2,
          name: "手機",
          description: "手機產品",
          parent_id: 1,
          sort_order: 1,
          products_count: 3,
          children: [],
        },
      ],
    },
    {
      id: 3,
      name: "服飾",
      description: "服飾分類",
      parent_id: null,
      sort_order: 2,
      products_count: 2,
      children: [],
    },
  ];

  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  };

  const mockDeleteCategory = {
    mutate: jest.fn(),
  };

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // 設定預設 mock 返回值
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useCategories as jest.Mock).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    });
    (useDeleteCategory as jest.Mock).mockReturnValue(mockDeleteCategory);
  });

  /**
   * 測試載入狀態
   */
  it("應該在載入時顯示載入指示器", () => {
    (useCategories as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(<CategoriesClientPage />);
    
    // 使用 class 選擇器來找到載入動畫
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  /**
   * 測試基本渲染
   */
  it("應該正確渲染分類管理頁面", () => {
    render(<CategoriesClientPage />);
    
    expect(screen.getByText("分類管理")).toBeInTheDocument();
    expect(screen.getByText("新增分類")).toBeInTheDocument();
    expect(screen.getByText("分類列表")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜尋分類名稱或描述...")).toBeInTheDocument();
  });

  /**
   * 測試分類資料顯示
   */
  it("應該正確顯示分類資料", () => {
    render(<CategoriesClientPage />);
    
    expect(screen.getByTestId("category-1")).toHaveTextContent("電子產品");
    expect(screen.getByTestId("category-2")).toHaveTextContent("手機");
    expect(screen.getByTestId("category-3")).toHaveTextContent("服飾");
  });

  /**
   * 測試搜尋功能
   */
  it("應該能夠搜尋分類", async () => {
    render(<CategoriesClientPage />);
    
    const searchInput = screen.getByPlaceholderText("搜尋分類名稱或描述...");
    
    // 搜尋 "電子"
    await user.type(searchInput, "電子");
    
    await waitFor(() => {
      expect(screen.getByTestId("category-1")).toBeInTheDocument();
      expect(screen.queryByTestId("category-3")).not.toBeInTheDocument();
    });
  });

  /**
   * 測試新增分類按鈕
   */
  it("應該能夠開啟新增分類 Modal", async () => {
    render(<CategoriesClientPage />);
    
    const addButton = screen.getByText("新增分類");
    await user.click(addButton);
    
    expect(screen.getByTestId("create-category-modal")).toHaveAttribute("data-open", "true");
  });

  /**
   * 測試新增子分類功能
   */
  it("應該能夠新增子分類", async () => {
    render(<CategoriesClientPage />);
    
    const addSubButton = screen.getByTestId("add-sub-1");
    await user.click(addSubButton);
    
    expect(screen.getByTestId("create-category-modal")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("parent-category")).toHaveTextContent("電子產品");
  });

  /**
   * 測試編輯分類功能
   */
  it("應該能夠編輯分類", async () => {
    render(<CategoriesClientPage />);
    
    const editButton = screen.getByTestId("edit-1");
    await user.click(editButton);
    
    expect(screen.getByTestId("update-category-modal")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("editing-category")).toHaveTextContent("電子產品");
  });

  /**
   * 測試刪除分類功能
   */
  it("應該能夠刪除分類", async () => {
    render(<CategoriesClientPage />);
    
    const deleteButton = screen.getByTestId("delete-1");
    await user.click(deleteButton);
    
    // 檢查刪除確認對話框
    expect(screen.getByText("確認刪除")).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return content.includes("您確定要刪除分類「電子產品」嗎？");
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return content.includes("注意：此分類包含 1 個子分類，將一併刪除。");
    })).toBeInTheDocument();
  });

  /**
   * 測試確認刪除操作
   */
  it("應該能夠確認刪除分類", async () => {
    mockDeleteCategory.mutate.mockImplementation((id, { onSuccess }) => {
      onSuccess();
    });

    render(<CategoriesClientPage />);
    
    const deleteButton = screen.getByTestId("delete-1");
    await user.click(deleteButton);
    
    const confirmButton = screen.getByText("刪除");
    await user.click(confirmButton);
    
    expect(mockDeleteCategory.mutate).toHaveBeenCalledWith(1, expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith("分類已成功刪除");
  });

  /**
   * 測試刪除錯誤處理
   */
  it("應該處理刪除錯誤", async () => {
    const error = new Error("刪除失敗");
    mockDeleteCategory.mutate.mockImplementation((id, { onError }) => {
      onError(error);
    });

    render(<CategoriesClientPage />);
    
    const deleteButton = screen.getByTestId("delete-1");
    await user.click(deleteButton);
    
    const confirmButton = screen.getByText("刪除");
    await user.click(confirmButton);
    
    expect(toast.error).toHaveBeenCalledWith("刪除失敗: 刪除失敗");
  });

  /**
   * 測試取消刪除操作
   */
  it("應該能夠取消刪除操作", async () => {
    render(<CategoriesClientPage />);
    
    const deleteButton = screen.getByTestId("delete-1");
    await user.click(deleteButton);
    
    const cancelButton = screen.getByText("取消");
    await user.click(cancelButton);
    
    expect(screen.queryByText("確認刪除")).not.toBeInTheDocument();
  });

  /**
   * 測試欄位顯示控制
   */
  it("應該能夠控制欄位顯示", async () => {
    render(<CategoriesClientPage />);
    
    const columnsButton = screen.getByText("欄位");
    await user.click(columnsButton);
    
    // 檢查欄位選項
    expect(screen.getByText("分類名稱")).toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.getByText("統計")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
  });

  /**
   * 測試 Modal 成功回調
   */
  it("應該處理新增分類成功", async () => {
    render(<CategoriesClientPage />);
    
    const addButton = screen.getByText("新增分類");
    await user.click(addButton);
    
    const successButton = screen.getByText("Create Success");
    await user.click(successButton);
    
    expect(screen.getByTestId("create-category-modal")).toHaveAttribute("data-open", "false");
  });

  /**
   * 測試編輯 Modal 成功回調
   */
  it("應該處理編輯分類成功", async () => {
    render(<CategoriesClientPage />);
    
    const editButton = screen.getByTestId("edit-1");
    await user.click(editButton);
    
    const successButton = screen.getByText("Update Success");
    await user.click(successButton);
    
    expect(screen.queryByTestId("update-category-modal")).not.toBeInTheDocument();
  });

  /**
   * 測試搜尋清空
   */
  it("應該能夠清空搜尋並顯示所有分類", async () => {
    render(<CategoriesClientPage />);
    
    const searchInput = screen.getByPlaceholderText("搜尋分類名稱或描述...");
    
    // 先搜尋
    await user.type(searchInput, "電子");
    await waitFor(() => {
      expect(screen.queryByTestId("category-3")).not.toBeInTheDocument();
    });
    
    // 清空搜尋
    await user.clear(searchInput);
    
    await waitFor(() => {
      expect(screen.getByTestId("category-3")).toBeInTheDocument();
    });
  });

  /**
   * 測試空資料狀態
   */
  it("應該處理空分類資料", () => {
    (useCategories as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<CategoriesClientPage />);
    
    expect(screen.getByTestId("draggable-categories-table")).toBeInTheDocument();
  });
}); 