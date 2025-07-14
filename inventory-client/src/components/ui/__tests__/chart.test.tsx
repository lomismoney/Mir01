import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartStyle,
} from '../chart';

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: ({ children }: any) => (
    <div data-testid="tooltip">{children}</div>
  ),
  Legend: ({ children }: any) => (
    <div data-testid="legend">{children}</div>
  ),
}));

describe('Chart Components', () => {
  describe('ChartContainer', () => {
    const mockConfig = {
      desktop: {
        label: 'Desktop',
        color: '#8884d8',
      },
      mobile: {
        label: 'Mobile',
        color: '#82ca9d',
      },
    };

    test('應該正確渲染 ChartContainer', () => {
      render(
        <ChartContainer config={mockConfig}>
          <div>Chart Content</div>
        </ChartContainer>
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByText('Chart Content')).toBeInTheDocument();
    });

    test('應該應用自定義 className', () => {
      const { container } = render(
        <ChartContainer config={mockConfig} className="custom-class">
          <div>Chart Content</div>
        </ChartContainer>
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    test('應該生成唯一的 chart ID', () => {
      const { container } = render(
        <ChartContainer config={mockConfig} id="test-chart">
          <div>Chart Content</div>
        </ChartContainer>
      );

      expect(container.querySelector('[data-chart="chart-test-chart"]')).toBeInTheDocument();
    });
  });

  describe('ChartStyle', () => {
    test('應該渲染 style 元素', () => {
      const config = {
        desktop: {
          label: 'Desktop',
          color: '#8884d8',
        },
      };

      render(<ChartStyle id="test-chart" config={config} />);

      const styleElement = document.querySelector('style');
      expect(styleElement).toBeInTheDocument();
      expect(styleElement?.innerHTML).toContain('--color-desktop: #8884d8');
    });

    test('當沒有顏色配置時應該返回 null', () => {
      const config = {
        desktop: {
          label: 'Desktop',
        },
      };

      const { container } = render(<ChartStyle id="test-chart" config={config} />);
      expect(container.querySelector('style')).not.toBeInTheDocument();
    });
  });

  describe('ChartTooltipContent', () => {
    const mockConfig = {
      desktop: {
        label: 'Desktop',
        color: '#8884d8',
      },
    };

    const mockPayload = [
      {
        name: 'desktop',
        value: 100,
        dataKey: 'desktop',
        color: '#8884d8',
        payload: { fill: '#8884d8' },
      },
    ];

    test('當 active 為 true 時應該渲染 tooltip', () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltipContent
            active={true}
            payload={mockPayload}
            label="Test Label"
          />
        </ChartContainer>
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('Desktop')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    test('當 active 為 false 時不應該渲染', () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltipContent
            active={false}
            payload={mockPayload}
            label="Test Label"
          />
        </ChartContainer>
      );

      expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
    });

    test('應該正確處理 hideLabel', () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltipContent
            active={true}
            payload={mockPayload}
            label="Test Label"
            hideLabel={true}
          />
        </ChartContainer>
      );

      expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
      expect(screen.getByText('Desktop')).toBeInTheDocument();
    });

    test('應該正確處理 hideIndicator', () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltipContent
            active={true}
            payload={mockPayload}
            hideIndicator={true}
          />
        </ChartContainer>
      );

      expect(screen.getAllByText('Desktop')).toHaveLength(2);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    test('應該正確處理自定義 formatter', () => {
      const customFormatter = (value: any, name: any) => `${name}: ${value}%`;

      render(
        <ChartContainer config={mockConfig}>
          <ChartTooltipContent
            active={true}
            payload={mockPayload}
            formatter={customFormatter}
          />
        </ChartContainer>
      );

      expect(screen.getByText('desktop: 100%')).toBeInTheDocument();
    });
  });

  describe('ChartLegendContent', () => {
    const mockConfig = {
      desktop: {
        label: 'Desktop',
        color: '#8884d8',
      },
      mobile: {
        label: 'Mobile',
        color: '#82ca9d',
      },
    };

    const mockPayload = [
      {
        value: 'desktop',
        dataKey: 'desktop',
        color: '#8884d8',
      },
      {
        value: 'mobile',
        dataKey: 'mobile',
        color: '#82ca9d',
      },
    ];

    test('應該渲染圖例項目', () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} />
        </ChartContainer>
      );

      expect(screen.getByText('Desktop')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
    });

    test('當沒有 payload 時不應該渲染', () => {
      const { container } = render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={[]} />
        </ChartContainer>
      );

      // 檢查容器中沒有 Desktop 或 Mobile 文本
      expect(screen.queryByText('Desktop')).not.toBeInTheDocument();
      expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
    });

    test('應該正確處理 hideIcon', () => {
      render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} hideIcon={true} />
        </ChartContainer>
      );

      expect(screen.getByText('Desktop')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
    });

    test('應該正確處理 verticalAlign', () => {
      const { container } = render(
        <ChartContainer config={mockConfig}>
          <ChartLegendContent payload={mockPayload} verticalAlign="top" />
        </ChartContainer>
      );

      expect(container.querySelector('.pb-3')).toBeInTheDocument();
    });
  });

  describe('useChart hook', () => {
    test('應該拋出錯誤當在 ChartContainer 外使用', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        const { ChartTooltipContent } = jest.requireMock<typeof import('../chart')>('../chart');
        return <ChartTooltipContent />;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useChart must be used within a <ChartContainer />'
      );

      consoleSpy.mockRestore();
    });
  });
}); 