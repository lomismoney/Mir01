import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleSelector } from "../role-selector";

/**
 * RoleSelector 組件測試
 * 
 * 測試範圍：
 * - 基本渲染
 * - 角色選擇功能
 * - 多選功能
 * - 禁用狀態
 * - 錯誤訊息顯示
 * - 回調函數調用
 */
describe("RoleSelector", () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnRolesChange = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  /**
   * 測試基本渲染
   */
  it("應該正確渲染所有角色選項", () => {
    render(
      <RoleSelector
        selectedRoles={[]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 檢查所有角色標籤是否存在
    expect(screen.getByText("管理員")).toBeInTheDocument();
    expect(screen.getByText("員工")).toBeInTheDocument();
    expect(screen.getByText("檢視者")).toBeInTheDocument();
    expect(screen.getByText("安裝師傅")).toBeInTheDocument();
    
    // 檢查描述文字
    expect(screen.getByText("擁有系統的完整管理權限")).toBeInTheDocument();
    expect(screen.getByText("可以管理商品、庫存和訂單")).toBeInTheDocument();
    expect(screen.getByText("只能查看系統資料，不能修改")).toBeInTheDocument();
    expect(screen.getByText("負責安裝工作，可查看和管理安裝單")).toBeInTheDocument();
  });

  /**
   * 測試預選角色的顯示
   */
  it("應該正確顯示已選中的角色", () => {
    render(
      <RoleSelector
        selectedRoles={["admin", "staff"]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 檢查已選中的 checkbox
    const adminCheckbox = screen.getByLabelText(/管理員/);
    const staffCheckbox = screen.getByLabelText(/員工/);
    const viewerCheckbox = screen.getByLabelText(/檢視者/);
    
    expect(adminCheckbox).toBeChecked();
    expect(staffCheckbox).toBeChecked();
    expect(viewerCheckbox).not.toBeChecked();
  });

  /**
   * 測試選擇角色功能
   */
  it("點擊未選中的角色應該添加到選中列表", async () => {
    render(
      <RoleSelector
        selectedRoles={["admin"]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 點擊員工角色
    const staffCheckbox = screen.getByLabelText(/員工/);
    await user.click(staffCheckbox);
    
    // 檢查回調函數是否被正確調用
    expect(mockOnRolesChange).toHaveBeenCalledWith(["admin", "staff"]);
  });

  /**
   * 測試取消選擇角色功能
   */
  it("點擊已選中的角色應該從選中列表移除", async () => {
    render(
      <RoleSelector
        selectedRoles={["admin", "staff", "viewer"]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 點擊已選中的員工角色
    const staffCheckbox = screen.getByLabelText(/員工/);
    await user.click(staffCheckbox);
    
    // 檢查回調函數是否被正確調用（移除 staff）
    expect(mockOnRolesChange).toHaveBeenCalledWith(["admin", "viewer"]);
  });

  /**
   * 測試多選功能
   */
  it("應該支援多選功能", async () => {
    // 測試從已選中一個角色開始
    render(
      <RoleSelector
        selectedRoles={["admin"]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 檢查預選的角色是否正確顯示
    const adminCheckbox = screen.getByLabelText(/管理員/);
    const staffCheckbox = screen.getByLabelText(/員工/);
    
    // 管理員應該已被選中
    expect(adminCheckbox).toBeChecked();
    expect(staffCheckbox).not.toBeChecked();
    
    // 點擊員工角色添加到選中列表
    await user.click(staffCheckbox);
    
    // 應該呼叫 onRolesChange 並包含兩個角色
    expect(mockOnRolesChange).toHaveBeenCalledWith(["admin", "staff"]);
  });

  /**
   * 測試禁用狀態
   */
  it("在禁用狀態下所有 checkbox 都應該被禁用", () => {
    render(
      <RoleSelector
        selectedRoles={["admin"]}
        onRolesChange={mockOnRolesChange}
        disabled={true}
      />
    );
    
    // 檢查所有 checkbox 都被禁用
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled();
    });
  });

  /**
   * 測試禁用狀態下點擊無效
   */
  it("在禁用狀態下點擊不應該觸發回調", async () => {
    render(
      <RoleSelector
        selectedRoles={[]}
        onRolesChange={mockOnRolesChange}
        disabled={true}
      />
    );
    
    const adminCheckbox = screen.getByLabelText(/管理員/);
    await user.click(adminCheckbox);
    
    // 禁用狀態下回調不應該被調用
    expect(mockOnRolesChange).not.toHaveBeenCalled();
  });

  /**
   * 測試沒有選擇角色時的錯誤訊息
   */
  it("沒有選擇任何角色時應該顯示錯誤訊息", () => {
    render(
      <RoleSelector
        selectedRoles={[]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 檢查錯誤訊息
    expect(screen.getByText("請至少選擇一個角色")).toBeInTheDocument();
  });

  /**
   * 測試有選擇角色時不顯示錯誤訊息
   */
  it("有選擇角色時不應該顯示錯誤訊息", () => {
    render(
      <RoleSelector
        selectedRoles={["admin"]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 錯誤訊息不應該存在
    expect(screen.queryByText("請至少選擇一個角色")).not.toBeInTheDocument();
  });

  /**
   * 測試角色圖標存在
   */
  it("每個角色都應該有對應的圖標", () => {
    render(
      <RoleSelector
        selectedRoles={[]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 檢查是否有 SVG 圖標（每個角色對應一個圖標）
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBe(4); // 至少有 4 個角色圖標
  });

  /**
   * 測試 Label 與 Checkbox 的關聯
   */
  it("點擊標籤應該能切換對應的 checkbox", async () => {
    render(
      <RoleSelector
        selectedRoles={[]}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 點擊管理員標籤
    const adminLabel = screen.getByText("管理員");
    await user.click(adminLabel);
    
    // 檢查回調函數是否被調用
    expect(mockOnRolesChange).toHaveBeenCalledWith(["admin"]);
  });

  /**
   * 測試所有角色都被選中的情況
   */
  it("所有角色都被選中時應該正確顯示", () => {
    const allRoles = ["admin", "staff", "viewer", "installer"];
    
    render(
      <RoleSelector
        selectedRoles={allRoles}
        onRolesChange={mockOnRolesChange}
      />
    );
    
    // 檢查所有 checkbox 都被選中
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
    
    // 不應該顯示錯誤訊息
    expect(screen.queryByText("請至少選擇一個角色")).not.toBeInTheDocument();
  });

  /**
   * 測試組件快照
   */
  it("應該匹配快照 - 無選擇狀態", () => {
    const { container } = render(
      <RoleSelector
        selectedRoles={[]}
        onRolesChange={mockOnRolesChange}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  /**
   * 測試組件快照 - 有選擇狀態
   */
  it("應該匹配快照 - 有選擇狀態", () => {
    const { container } = render(
      <RoleSelector
        selectedRoles={["admin", "staff"]}
        onRolesChange={mockOnRolesChange}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  /**
   * 測試組件快照 - 禁用狀態
   */
  it("應該匹配快照 - 禁用狀態", () => {
    const { container } = render(
      <RoleSelector
        selectedRoles={["admin"]}
        onRolesChange={mockOnRolesChange}
        disabled={true}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
}); 
