import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../pagination';

describe('Pagination 組件測試', () => {
  it('應該正確渲染 Pagination 組件', () => {
    render(
      <Pagination data-testid="pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#" data-testid="page-link">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    const pagination = screen.getByTestId('pagination');
    expect(pagination).toBeInTheDocument();
    expect(pagination).toHaveAttribute('role', 'navigation');
    expect(pagination).toHaveAttribute('aria-label', 'pagination');
    expect(pagination).toHaveAttribute('data-slot', 'pagination');
  });

  it('應該正確渲染 PaginationContent', () => {
    render(
      <Pagination>
        <PaginationContent data-testid="pagination-content">
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    const content = screen.getByTestId('pagination-content');
    expect(content).toBeInTheDocument();
    expect(content.tagName).toBe('UL');
    expect(content).toHaveAttribute('data-slot', 'pagination-content');
    expect(content).toHaveClass('flex', 'flex-row', 'items-center', 'gap-1');
  });

  it('應該正確渲染 PaginationItem', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem data-testid="pagination-item">
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    const item = screen.getByTestId('pagination-item');
    expect(item).toBeInTheDocument();
    expect(item.tagName).toBe('LI');
    expect(item).toHaveAttribute('data-slot', 'pagination-item');
  });

  it('應該正確渲染 PaginationLink 並支援 active 狀態', () => {
    const { rerender } = render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#" data-testid="page-link">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    let link = screen.getByTestId('page-link');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('data-slot', 'pagination-link');
    expect(link).not.toHaveAttribute('aria-current');
    
    // 測試 active 狀態
    rerender(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#" isActive data-testid="page-link">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    link = screen.getByTestId('page-link');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveAttribute('data-active', 'true');
  });

  it('應該正確渲染 PaginationPrevious', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" data-testid="previous-link" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    const previousLink = screen.getByTestId('previous-link');
    expect(previousLink).toBeInTheDocument();
    expect(previousLink).toHaveAttribute('aria-label', 'Go to previous page');
    expect(previousLink).toHaveTextContent('Previous');
    expect(previousLink).toHaveClass('gap-1', 'px-2.5', 'sm:pl-2.5');
  });

  it('應該正確渲染 PaginationNext', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationNext href="#" data-testid="next-link" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    const nextLink = screen.getByTestId('next-link');
    expect(nextLink).toBeInTheDocument();
    expect(nextLink).toHaveAttribute('aria-label', 'Go to next page');
    expect(nextLink).toHaveTextContent('Next');
    expect(nextLink).toHaveClass('gap-1', 'px-2.5', 'sm:pr-2.5');
  });

  it('應該正確渲染 PaginationEllipsis', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationEllipsis data-testid="ellipsis" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    const ellipsis = screen.getByTestId('ellipsis');
    expect(ellipsis).toBeInTheDocument();
    expect(ellipsis.tagName).toBe('SPAN');
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    expect(ellipsis).toHaveAttribute('data-slot', 'pagination-ellipsis');
    expect(ellipsis).toHaveClass('flex', 'size-9', 'items-center', 'justify-center');
    
    // 檢查是否有 "More pages" 的螢幕閱讀器文字
    expect(screen.getByText('More pages')).toBeInTheDocument();
  });

  it('應該支援自定義 className', () => {
    render(
      <Pagination className="custom-pagination" data-testid="pagination">
        <PaginationContent className="custom-content" data-testid="content">
          <PaginationItem>
            <PaginationLink href="#" className="custom-link" data-testid="link">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    expect(screen.getByTestId('pagination')).toHaveClass('custom-pagination');
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
    expect(screen.getByTestId('link')).toHaveClass('custom-link');
  });

  it('應該支援點擊導航', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" onClick={handleClick} data-testid="previous" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" onClick={handleClick} data-testid="page-1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" onClick={handleClick} data-testid="next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    await user.click(screen.getByTestId('previous'));
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    await user.click(screen.getByTestId('page-1'));
    expect(handleClick).toHaveBeenCalledTimes(2);
    
    await user.click(screen.getByTestId('next'));
    expect(handleClick).toHaveBeenCalledTimes(3);
  });

  it('應該正確渲染完整的分頁範例', () => {
    render(
      <Pagination data-testid="full-pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">10</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    
    // 檢查所有元素都存在
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('More pages')).toBeInTheDocument();
    
    // 檢查 active 狀態
    const activePage = screen.getByText('1').closest('a');
    expect(activePage).toHaveAttribute('aria-current', 'page');
  });
}); 