import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryOptionRenderer } from "../CategoryOptionRenderer";
import { Category } from "@/types/category";

// Mock Command 組件
jest.mock("@/components/ui/command", () => ({
  CommandItem: ({ children, onSelect, style, ...props }: any) => (
    <div
      onClick={onSelect}
      style={style}
      data-testid="command-item"
      {...props}
    >
      {children}
    </div>
  ),
}));

/**
 * CategoryOptionRenderer 組件測試
 */
describe("CategoryOptionRenderer", () => {
  const mockOnSelect = jest.fn();

  // 測試用的分類數據
  const mockCategories: Category[] = [
    {
      id: 1,
      name: "電子產品",
      description: "電子產品分類",
      parent_id: null,
      level: 0,
      path: "1",
      is_active: true,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "手機",
      description: "手機分類",
      parent_id: 1,
      level: 1,
      path: "1.2",
      is_active: true,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 測試基本渲染
   */
  it("應該正確渲染分類名稱", () => {
    render(
      <CategoryOptionRenderer
        category={mockCategories[0]}
        allCategories={{}}
        currentValue={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("電子產品")).toBeInTheDocument();
  });

  /**
   * 測試選中狀態顯示
   */
  it("當分類被選中時應該顯示勾選圖標", () => {
    render(
      <CategoryOptionRenderer
        category={mockCategories[0]}
        allCategories={{}}
        currentValue={1}
        onSelect={mockOnSelect}
      />
    );

    const checkIcon = screen.getByTestId("command-item").querySelector("svg");
    expect(checkIcon).toHaveClass("opacity-100");
  });

  /**
   * 測試點擊選擇功能
   */
  it("點擊分類選項時應該調用 onSelect 回調", async () => {
    const user = userEvent.setup();
    render(
      <CategoryOptionRenderer
        category={mockCategories[0]}
        allCategories={{}}
        currentValue={null}
        onSelect={mockOnSelect}
      />
    );

    await user.click(screen.getByTestId("command-item"));
    expect(mockOnSelect).toHaveBeenCalledWith(1);
  });

  /**
   * 測試縮排計算
   */
  it("應該根據層級計算正確的縮排", () => {
    render(
      <CategoryOptionRenderer
        category={mockCategories[0]}
        allCategories={{}}
        currentValue={null}
        onSelect={mockOnSelect}
        level={2}
      />
    );

    const commandItem = screen.getByTestId("command-item");
    expect(commandItem).toHaveStyle({ paddingLeft: "4rem" }); // 1 + 2 * 1.5 = 4rem
  });

  /**
   * 測試預設層級
   */
  it("當未指定層級時應該使用預設層級 0", () => {
    render(
      <CategoryOptionRenderer
        category={mockCategories[0]}
        allCategories={{}}
        currentValue={null}
        onSelect={mockOnSelect}
      />
    );

    const commandItem = screen.getByTestId("command-item");
    expect(commandItem).toHaveStyle({ paddingLeft: "1rem" }); // 1 + 0 * 1.5 = 1rem
  });

  /**
   * 測試遞迴渲染子分類
   */
  it("應該遞迴渲染所有子分類", () => {
    const mockAllCategories: Record<string, Category[]> = {
      "1": [mockCategories[1]], // 電子產品 -> 手機
    };

    render(
      <CategoryOptionRenderer
        category={mockCategories[0]}
        allCategories={mockAllCategories}
        currentValue={null}
        onSelect={mockOnSelect}
      />
    );

    // 檢查父分類
    expect(screen.getByText("電子產品")).toBeInTheDocument();
    
    // 檢查子分類
    expect(screen.getByText("手機")).toBeInTheDocument();
  });

  /**
   * 測試沒有子分類的情況
   */
  it("沒有子分類時應該只渲染自身", () => {
    render(
      <CategoryOptionRenderer
        category={mockCategories[1]}
        allCategories={{}}
        currentValue={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("手機")).toBeInTheDocument();
    expect(screen.getAllByTestId("command-item")).toHaveLength(1);
  });
});
