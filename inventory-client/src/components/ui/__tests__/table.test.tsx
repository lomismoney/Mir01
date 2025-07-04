import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';

describe('Table 組件測試', () => {
  it('應該正確渲染 Table 組件', () => {
    render(
      <Table data-testid="table">
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>年齡</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>張三</TableCell>
            <TableCell>25</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const table = screen.getByTestId('table');
    expect(table).toBeInTheDocument();
    expect(table.tagName).toBe('TABLE');
  });

  it('應該正確渲染 TableHeader 和 TableHead', () => {
    render(
      <Table>
        <TableHeader data-testid="header">
          <TableRow>
            <TableHead data-testid="head1">產品名稱</TableHead>
            <TableHead data-testid="head2">價格</TableHead>
            <TableHead data-testid="head3">庫存</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header.tagName).toBe('THEAD');
    
    expect(screen.getByTestId('head1')).toHaveTextContent('產品名稱');
    expect(screen.getByTestId('head2')).toHaveTextContent('價格');
    expect(screen.getByTestId('head3')).toHaveTextContent('庫存');
  });

  it('應該正確渲染 TableBody 和 TableCell', () => {
    render(
      <Table>
        <TableBody data-testid="body">
          <TableRow data-testid="row1">
            <TableCell data-testid="cell1">iPhone 14</TableCell>
            <TableCell data-testid="cell2">$999</TableCell>
            <TableCell data-testid="cell3">50</TableCell>
          </TableRow>
          <TableRow data-testid="row2">
            <TableCell data-testid="cell4">iPad Air</TableCell>
            <TableCell data-testid="cell5">$599</TableCell>
            <TableCell data-testid="cell6">30</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const body = screen.getByTestId('body');
    expect(body).toBeInTheDocument();
    expect(body.tagName).toBe('TBODY');
    
    expect(screen.getByTestId('cell1')).toHaveTextContent('iPhone 14');
    expect(screen.getByTestId('cell2')).toHaveTextContent('$999');
    expect(screen.getByTestId('cell3')).toHaveTextContent('50');
    expect(screen.getByTestId('cell4')).toHaveTextContent('iPad Air');
  });

  it('應該正確渲染 TableCaption', () => {
    render(
      <Table>
        <TableCaption data-testid="caption">
          產品庫存清單 - 2024年12月
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>產品</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    
    const caption = screen.getByTestId('caption');
    expect(caption).toBeInTheDocument();
    expect(caption.tagName).toBe('CAPTION');
    expect(caption).toHaveTextContent('產品庫存清單 - 2024年12月');
  });

  it('應該正確渲染 TableFooter', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>項目</TableHead>
            <TableHead>數量</TableHead>
            <TableHead>金額</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>商品A</TableCell>
            <TableCell>2</TableCell>
            <TableCell>$200</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter data-testid="footer">
          <TableRow>
            <TableCell>總計</TableCell>
            <TableCell>2</TableCell>
            <TableCell>$200</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    
    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer.tagName).toBe('TFOOT');
    expect(screen.getByText('總計')).toBeInTheDocument();
  });

  it('應該支援自定義 className', () => {
    render(
      <Table className="custom-table" data-testid="table">
        <TableHeader className="custom-header" data-testid="header">
          <TableRow className="custom-row" data-testid="row">
            <TableHead className="custom-head" data-testid="head">
              標題
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="custom-body" data-testid="body">
          <TableRow>
            <TableCell className="custom-cell" data-testid="cell">
              內容
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    expect(screen.getByTestId('table')).toHaveClass('custom-table');
    expect(screen.getByTestId('header')).toHaveClass('custom-header');
    expect(screen.getByTestId('row')).toHaveClass('custom-row');
    expect(screen.getByTestId('head')).toHaveClass('custom-head');
    expect(screen.getByTestId('body')).toHaveClass('custom-body');
    expect(screen.getByTestId('cell')).toHaveClass('custom-cell');
  });

  it('應該正確處理複雜的表格結構', () => {
    render(
      <Table>
        <TableCaption>員工資訊表</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>部門</TableHead>
            <TableHead>職位</TableHead>
            <TableHead>薪資</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>王小明</TableCell>
            <TableCell>技術部</TableCell>
            <TableCell>前端工程師</TableCell>
            <TableCell>$60,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>李小華</TableCell>
            <TableCell>設計部</TableCell>
            <TableCell>UI/UX 設計師</TableCell>
            <TableCell>$55,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>張小美</TableCell>
            <TableCell>行銷部</TableCell>
            <TableCell>行銷經理</TableCell>
            <TableCell>$70,000</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>平均薪資</TableCell>
            <TableCell>$61,667</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    
    expect(screen.getByText('員工資訊表')).toBeInTheDocument();
    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.getByText('技術部')).toBeInTheDocument();
    expect(screen.getByText('前端工程師')).toBeInTheDocument();
    expect(screen.getByText('平均薪資')).toBeInTheDocument();
    expect(screen.getByText('$61,667')).toBeInTheDocument();
  });

  it('應該正確處理空表格', () => {
    render(
      <Table data-testid="empty-table">
        <TableHeader>
          <TableRow>
            <TableHead>列標題</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>暫無資料</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    const table = screen.getByTestId('empty-table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('暫無資料')).toBeInTheDocument();
  });

  it('應該支援表格基本的樣式類別', () => {
    render(
      <Table data-testid="table">
        <TableHeader>
          <TableRow>
            <TableHead>測試</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    
    const table = screen.getByTestId('table');
    expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
  });
}); 