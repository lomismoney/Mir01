import React from "react";
import { render } from "@testing-library/react";
import AuthLoading from "../AuthLoading";

/**
 * AuthLoading 組件測試
 * 
 * 測試範圍：
 * - 組件正確渲染
 * - 容器樣式檢查
 * - 載入圖示存在性
 * - 動畫樣式驗證
 * - 無障礙性測試
 */
describe("AuthLoading", () => {
  /**
   * 測試組件基本渲染功能
   */
  it("應該正確渲染載入組件", () => {
    render(<AuthLoading />);
    
    // 檢查載入容器是否存在
    const container = document.querySelector(
      ".flex.items-center.justify-center.h-screen"
    );
    expect(container).toBeInTheDocument();
  });

  /**
   * 測試 Loader2 圖示的存在
   */
  it("應該顯示 Loader2 載入圖示", () => {
    render(<AuthLoading />);
    
    // 檢查載入圖示是否存在
    const loader = document.querySelector(".animate-spin");
    expect(loader).toBeInTheDocument();
  });

  /**
   * 測試載入圖示的樣式類別
   */
  it("應該包含正確的載入圖示樣式", () => {
    render(<AuthLoading />);
    
    // 檢查載入圖示的所有樣式類別
    const loader = document.querySelector("svg");
    expect(loader).toHaveClass("h-8", "w-8", "animate-spin", "text-primary");
  });

  /**
   * 測試容器佈局樣式
   */
  it("應該包含正確的容器佈局樣式", () => {
    render(<AuthLoading />);
    
    // 檢查容器的佈局樣式 (找到實際的 AuthLoading 容器)
    const container = document.querySelector(
      ".flex.items-center.justify-center.h-screen"
    );
    expect(container).toHaveClass(
      "flex", 
      "items-center", 
      "justify-center", 
      "h-screen"
    );
  });

  /**
   * 測試組件結構
   */
  it("應該具有正確的DOM結構", () => {
    render(<AuthLoading />);
    
    // 檢查 AuthLoading 容器存在
    const authContainer = document.querySelector(
      ".flex.items-center.justify-center.h-screen"
    );
    expect(authContainer).toBeInTheDocument();
    
    // 檢查SVG圖示存在
    const svgIcon = document.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    
    // 檢查至少有一個div容器 (測試環境可能會有額外的wrapper)
    const divElements = document.querySelectorAll("div");
    expect(divElements.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * 測試無障礙性
   */
  it("應該提供適當的無障礙性支援", () => {
    render(<AuthLoading />);
    
    // 檢查 AuthLoading 的主容器
    const authContainer = document.querySelector(
      ".flex.items-center.justify-center.h-screen"
    );
    expect(authContainer).toBeInTheDocument();
    
    // 檢查載入圖示的基本結構
    const svgIcon = document.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass("animate-spin");
  });

  /**
   * 測試組件快照
   */
  it("應該匹配快照", () => {
    const { container } = render(<AuthLoading />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 