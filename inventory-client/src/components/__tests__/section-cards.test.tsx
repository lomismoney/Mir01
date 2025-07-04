/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionCards } from '../section-cards';

/**
 * SectionCards 組件測試
 * 
 * 測試區域卡片組件的渲染
 */
describe('SectionCards 組件測試', () => {
  it('應該正確渲染組件', () => {
    render(<SectionCards />);
    
    // 檢查是否渲染了容器
    const container = document.querySelector('[data-oid]');
    expect(container).toBeInTheDocument();
  });

  it('應該有正確的網格佈局類別', () => {
    render(<SectionCards />);
    
    const container = document.querySelector('[data-oid]');
    expect(container).toHaveClass('grid');
  });

  it('應該包含卡片元素', () => {
    render(<SectionCards />);
    
    // 檢查是否有卡片元素
    const cards = document.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('應該顯示數據內容', () => {
    render(<SectionCards />);
    
    // 檢查是否有數據顯示
    const titles = document.querySelectorAll('[data-slot="card-title"]');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('應該有描述文字', () => {
    render(<SectionCards />);
    
    // 檢查是否有描述
    const descriptions = document.querySelectorAll('[data-slot="card-description"]');
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('應該有統計數據', () => {
    render(<SectionCards />);
    
    // 檢查是否顯示了統計數據
    expect(screen.getByText('15,234')).toBeInTheDocument();
    expect(screen.getByText('127')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
  });

  it('應該顯示增長指標', () => {
    render(<SectionCards />);
    
    // 檢查是否有增長指標
    expect(screen.getByText('+8.2%')).toBeInTheDocument();
    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('-12%')).toBeInTheDocument();
  });

  it('應該包含圖標元素', () => {
    render(<SectionCards />);
    
    // 檢查是否有 SVG 圖標
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('應該有正確的響應式類別', () => {
    render(<SectionCards />);
    
    const container = document.querySelector('[data-oid]');
    expect(container).toHaveClass('grid-cols-1');
  });

  it('應該包含卡片動作元素', () => {
    render(<SectionCards />);
    
    // 檢查是否有卡片動作
    const actions = document.querySelectorAll('[data-slot="card-action"]');
    expect(actions.length).toBeGreaterThan(0);
  });
}); 