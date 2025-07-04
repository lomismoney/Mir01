import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from '../card';

describe('Card 組件', () => {
  describe('Card', () => {
    it('應該正確渲染', () => {
      render(<Card>測試內容</Card>);
      
      const card = screen.getByText('測試內容');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-slot', 'card');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<Card>測試內容</Card>);
      
      const card = screen.getByText('測試內容');
      expect(card).toHaveClass('bg-card', 'text-card-foreground', 'flex', 'flex-col', 'gap-6', 'rounded-xl', 'border', 'py-6', 'shadow-sm');
    });

    it('應該合併自定義的 className', () => {
      render(<Card className="custom-class">測試內容</Card>);
      
      const card = screen.getByText('測試內容');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('bg-card'); // 應該保留預設類
    });

    it('應該傳遞其他 props', () => {
      render(<Card id="test-card" data-testid="card">測試內容</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('id', 'test-card');
    });
  });

  describe('CardHeader', () => {
    it('應該正確渲染', () => {
      render(<CardHeader>標題區域</CardHeader>);
      
      const header = screen.getByText('標題區域');
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<CardHeader>標題區域</CardHeader>);
      
      const header = screen.getByText('標題區域');
      expect(header).toHaveClass('grid', 'auto-rows-min', 'items-start', 'gap-1.5', 'px-6');
    });

    it('應該合併自定義的 className', () => {
      render(<CardHeader className="custom-header">標題區域</CardHeader>);
      
      const header = screen.getByText('標題區域');
      expect(header).toHaveClass('custom-header');
      expect(header).toHaveClass('grid'); // 應該保留預設類
    });
  });

  describe('CardTitle', () => {
    it('應該正確渲染', () => {
      render(<CardTitle>卡片標題</CardTitle>);
      
      const title = screen.getByText('卡片標題');
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<CardTitle>卡片標題</CardTitle>);
      
      const title = screen.getByText('卡片標題');
      expect(title).toHaveClass('leading-none', 'font-semibold');
    });

    it('應該合併自定義的 className', () => {
      render(<CardTitle className="custom-title">卡片標題</CardTitle>);
      
      const title = screen.getByText('卡片標題');
      expect(title).toHaveClass('custom-title');
      expect(title).toHaveClass('font-semibold'); // 應該保留預設類
    });
  });

  describe('CardDescription', () => {
    it('應該正確渲染', () => {
      render(<CardDescription>卡片描述</CardDescription>);
      
      const description = screen.getByText('卡片描述');
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('data-slot', 'card-description');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<CardDescription>卡片描述</CardDescription>);
      
      const description = screen.getByText('卡片描述');
      expect(description).toHaveClass('text-muted-foreground', 'text-sm');
    });

    it('應該合併自定義的 className', () => {
      render(<CardDescription className="custom-desc">卡片描述</CardDescription>);
      
      const description = screen.getByText('卡片描述');
      expect(description).toHaveClass('custom-desc');
      expect(description).toHaveClass('text-sm'); // 應該保留預設類
    });
  });

  describe('CardAction', () => {
    it('應該正確渲染', () => {
      render(<CardAction>操作按鈕</CardAction>);
      
      const action = screen.getByText('操作按鈕');
      expect(action).toBeInTheDocument();
      expect(action).toHaveAttribute('data-slot', 'card-action');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<CardAction>操作按鈕</CardAction>);
      
      const action = screen.getByText('操作按鈕');
      expect(action).toHaveClass('col-start-2', 'row-span-2', 'row-start-1', 'self-start', 'justify-self-end');
    });

    it('應該合併自定義的 className', () => {
      render(<CardAction className="custom-action">操作按鈕</CardAction>);
      
      const action = screen.getByText('操作按鈕');
      expect(action).toHaveClass('custom-action');
      expect(action).toHaveClass('col-start-2'); // 應該保留預設類
    });
  });

  describe('CardContent', () => {
    it('應該正確渲染', () => {
      render(<CardContent>卡片內容</CardContent>);
      
      const content = screen.getByText('卡片內容');
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<CardContent>卡片內容</CardContent>);
      
      const content = screen.getByText('卡片內容');
      expect(content).toHaveClass('px-6');
    });

    it('應該合併自定義的 className', () => {
      render(<CardContent className="custom-content">卡片內容</CardContent>);
      
      const content = screen.getByText('卡片內容');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('px-6'); // 應該保留預設類
    });
  });

  describe('CardFooter', () => {
    it('應該正確渲染', () => {
      render(<CardFooter>卡片底部</CardFooter>);
      
      const footer = screen.getByText('卡片底部');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<CardFooter>卡片底部</CardFooter>);
      
      const footer = screen.getByText('卡片底部');
      expect(footer).toHaveClass('flex', 'items-center', 'px-6');
    });

    it('應該合併自定義的 className', () => {
      render(<CardFooter className="custom-footer">卡片底部</CardFooter>);
      
      const footer = screen.getByText('卡片底部');
      expect(footer).toHaveClass('custom-footer');
      expect(footer).toHaveClass('flex'); // 應該保留預設類
    });
  });

  describe('完整的 Card 組合', () => {
    it('應該正確渲染完整的卡片結構', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>測試標題</CardTitle>
            <CardDescription>測試描述</CardDescription>
            <CardAction>操作</CardAction>
          </CardHeader>
          <CardContent>
            <p>這是卡片的主要內容。</p>
          </CardContent>
          <CardFooter>
            <button>確定</button>
          </CardFooter>
        </Card>
      );

      // 檢查所有元素都存在
      expect(screen.getByText('測試標題')).toBeInTheDocument();
      expect(screen.getByText('測試描述')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
      expect(screen.getByText('這是卡片的主要內容。')).toBeInTheDocument();
      expect(screen.getByText('確定')).toBeInTheDocument();
    });
  });
}); 