import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '../breadcrumb';

describe('Breadcrumb 組件測試', () => {
  it('應該正確渲染 Breadcrumb 組件', () => {
    render(
      <Breadcrumb data-testid="breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首頁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>當前頁面</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const breadcrumb = screen.getByTestId('breadcrumb');
    expect(breadcrumb).toBeInTheDocument();
    expect(breadcrumb).toHaveAttribute('aria-label', 'breadcrumb');
  });

  it('應該正確渲染 BreadcrumbList', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList data-testid="list">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首頁</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const list = screen.getByTestId('list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-1.5', 'break-words', 'text-sm', 'text-muted-foreground');
  });

  it('應該正確渲染 BreadcrumbItem', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem data-testid="item">
            <BreadcrumbLink href="/">首頁</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const item = screen.getByTestId('item');
    expect(item).toBeInTheDocument();
    expect(item).toHaveClass('inline-flex', 'items-center', 'gap-1.5');
  });

  it('應該正確渲染 BreadcrumbLink', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/products" data-testid="link">
              產品列表
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const link = screen.getByTestId('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass('transition-colors', 'hover:text-foreground');
    expect(link).toHaveAttribute('href', '/products');
    expect(link).toHaveTextContent('產品列表');
  });

  it('應該正確渲染 BreadcrumbPage', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage data-testid="page">
              當前頁面
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const page = screen.getByTestId('page');
    expect(page).toBeInTheDocument();
    expect(page).toHaveClass('font-normal', 'text-foreground');
    expect(page).toHaveAttribute('aria-current', 'page');
    expect(page).toHaveTextContent('當前頁面');
  });

  it('應該正確渲染 BreadcrumbSeparator', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首頁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator data-testid="separator" />
          <BreadcrumbItem>
            <BreadcrumbPage>頁面</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('aria-hidden', 'true');
  });

  it('應該正確渲染 BreadcrumbEllipsis', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首頁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis data-testid="ellipsis" />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>當前頁面</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const ellipsis = screen.getByTestId('ellipsis');
    expect(ellipsis).toBeInTheDocument();
    expect(ellipsis).toHaveClass('flex', 'h-9', 'w-9', 'items-center', 'justify-center');
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
  });

  it('應該支援自定義 className', () => {
    render(
      <Breadcrumb className="custom-breadcrumb" data-testid="breadcrumb">
        <BreadcrumbList className="custom-list" data-testid="list">
          <BreadcrumbItem className="custom-item" data-testid="item">
            <BreadcrumbLink 
              href="/" 
              className="custom-link" 
              data-testid="link"
            >
              首頁
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="custom-separator" data-testid="separator" />
          <BreadcrumbItem>
            <BreadcrumbPage className="custom-page" data-testid="page">
              頁面
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    expect(screen.getByTestId('breadcrumb')).toHaveClass('custom-breadcrumb');
    expect(screen.getByTestId('list')).toHaveClass('custom-list');
    expect(screen.getByTestId('item')).toHaveClass('custom-item');
    expect(screen.getByTestId('link')).toHaveClass('custom-link');
    expect(screen.getByTestId('separator')).toHaveClass('custom-separator');
    expect(screen.getByTestId('page')).toHaveClass('custom-page');
  });

  it('應該正確處理複雜的麵包屑導航', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首頁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">產品</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products/electronics">電子產品</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>手機</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    expect(screen.getByText('首頁')).toBeInTheDocument();
    expect(screen.getByText('產品')).toBeInTheDocument();
    expect(screen.getByText('電子產品')).toBeInTheDocument();
    expect(screen.getByText('手機')).toBeInTheDocument();
    
    // 檢查連結
    expect(screen.getByText('首頁')).toHaveAttribute('href', '/');
    expect(screen.getByText('產品')).toHaveAttribute('href', '/products');
    expect(screen.getByText('電子產品')).toHaveAttribute('href', '/products/electronics');
    
    // 當前頁面不應該有 href
    expect(screen.getByText('手機')).not.toHaveAttribute('href');
  });

  it('應該正確處理省略號展開', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">首頁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis data-testid="ellipsis" />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products/electronics">電子產品</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>當前項目</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const ellipsis = screen.getByTestId('ellipsis');
    expect(ellipsis).toBeInTheDocument();
    
    // 檢查省略號是否包含正確的圖標
    const icon = ellipsis.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('應該正確處理無障礙設計', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" aria-label="前往首頁">
              首頁
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator aria-hidden="true" />
          <BreadcrumbItem>
            <BreadcrumbPage aria-current="page">
              當前頁面
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
    
    const link = screen.getByText('首頁');
    expect(link).toHaveAttribute('aria-label', '前往首頁');
    
    const page = screen.getByText('當前頁面');
    expect(page).toHaveAttribute('aria-current', 'page');
  });
});
