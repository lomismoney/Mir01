import React from 'react';
import { render, screen } from '@testing-library/react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { VirtualTable } from '@/components/ui/virtual-table';
import '@testing-library/jest-dom';

// 模擬數據
const mockData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: (Math.random() * 1000).toFixed(2),
}));

const columnHelper = createColumnHelper<typeof mockData[0]>();

const mockColumns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('price', {
    header: 'Price',
    cell: info => `$${info.getValue()}`,
  }),
];

// 測試組件包裝器
function TestVirtualTable() {
  const table = useReactTable({
    data: mockData,
    columns: mockColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <VirtualTable
      table={table}
      containerHeight={400}
      estimateSize={50}
      overscan={5}
    />
  );
}

describe('VirtualTable', () => {
  it('should render table headers', () => {
    render(<TestVirtualTable />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
  });

  it('should render table content', () => {
    render(<TestVirtualTable />);
    
    // 應該渲染一些行（但不是全部，因為是虛擬化的）
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('should not render all rows at once', () => {
    render(<TestVirtualTable />);
    
    // 最後一個產品不應該立即渲染（虛擬化）
    expect(screen.queryByText('Product 1000')).not.toBeInTheDocument();
  });

  it('should handle empty data', () => {
    const EmptyTable = () => {
      const table = useReactTable({
        data: [],
        columns: mockColumns,
        getCoreRowModel: getCoreRowModel(),
      });

      return (
        <VirtualTable
          table={table}
          containerHeight={400}
          estimateSize={50}
          overscan={5}
          emptyMessage="No data available"
        />
      );
    };

    render(<EmptyTable />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});