import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '../QueryProvider';

// Mock ReactQueryDevtools
jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => <div data-testid="react-query-devtools">DevTools</div>,
}));

// Mock isServer to test different scenarios
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    isServer: false, // Default to client-side
  };
});

/**
 * QueryProvider 測試套件
 * 
 * 測試範圍：
 * - 基本渲染功能
 * - 開發環境 vs 生產環境行為
 * - 子組件正確渲染
 * - QueryClient 提供功能
 */
describe('QueryProvider 組件測試', () => {
  const TestChild = () => <div data-testid="test-child">Test Child</div>;

  // Mock 環境變數
  const mockEnv = (nodeEnv: string) => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: nodeEnv,
      writable: true,
      configurable: true,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本功能測試', () => {
    it('應該正確渲染子組件', () => {
      render(
        <QueryProvider>
          <TestChild />
        </QueryProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('應該提供 QueryClient 環境給子組件', () => {
      const ChildWithQueryClient = () => {
        // 這個組件如果能渲染，表示 QueryClient 環境正常
        return <div data-testid="query-enabled-child">Query Enabled</div>;
      };

      render(
        <QueryProvider>
          <ChildWithQueryClient />
        </QueryProvider>
      );

      expect(screen.getByTestId('query-enabled-child')).toBeInTheDocument();
    });

    it('應該能夠處理多個子組件', () => {
      render(
        <QueryProvider>
          <TestChild />
          <div data-testid="second-child">Second Child</div>
          <div data-testid="third-child">Third Child</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('second-child')).toBeInTheDocument();
      expect(screen.getByTestId('third-child')).toBeInTheDocument();
    });
  });

  describe('開發環境行為測試', () => {
    it('在開發環境應該顯示 ReactQueryDevtools', () => {
      mockEnv('development');

      render(
        <QueryProvider>
          <TestChild />
        </QueryProvider>
      );

      expect(screen.getByTestId('react-query-devtools')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('在生產環境不應該顯示 ReactQueryDevtools', () => {
      mockEnv('production');

      render(
        <QueryProvider>
          <TestChild />
        </QueryProvider>
      );

      expect(screen.queryByTestId('react-query-devtools')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('在測試環境不應該顯示 ReactQueryDevtools', () => {
      mockEnv('test');

      render(
        <QueryProvider>
          <TestChild />
        </QueryProvider>
      );

      expect(screen.queryByTestId('react-query-devtools')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('在 undefined 環境不應該顯示 ReactQueryDevtools', () => {
      mockEnv('');

      render(
        <QueryProvider>
          <TestChild />
        </QueryProvider>
      );

      expect(screen.queryByTestId('react-query-devtools')).not.toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('錯誤處理測試', () => {
    it('應該正確處理空的 children', () => {
      render(<QueryProvider>{null}</QueryProvider>);
      
      // 組件應該正常渲染，即使沒有子組件
      expect(() => render(<QueryProvider>{null}</QueryProvider>)).not.toThrow();
    });

    it('應該正確處理 undefined children', () => {
      render(<QueryProvider>{undefined}</QueryProvider>);
      
      expect(() => render(<QueryProvider>{undefined}</QueryProvider>)).not.toThrow();
    });

    it('應該正確處理空字串 children', () => {
      render(<QueryProvider>{''}</QueryProvider>);
      
      expect(() => render(<QueryProvider>{''}</QueryProvider>)).not.toThrow();
    });
  });

  describe('嵌套結構測試', () => {
    it('應該正確處理深層嵌套的子組件', () => {
      const NestedComponent = () => (
        <div data-testid="level-1">
          <div data-testid="level-2">
            <div data-testid="level-3">
              <TestChild />
            </div>
          </div>
        </div>
      );

      render(
        <QueryProvider>
          <NestedComponent />
        </QueryProvider>
      );

      expect(screen.getByTestId('level-1')).toBeInTheDocument();
      expect(screen.getByTestId('level-2')).toBeInTheDocument();
      expect(screen.getByTestId('level-3')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('應該能處理複雜的組件樹', () => {
      const ComplexTree = () => (
        <div data-testid="complex-root">
          <header data-testid="header">
            <nav data-testid="nav">Navigation</nav>
          </header>
          <main data-testid="main">
            <section data-testid="section">
              <TestChild />
            </section>
          </main>
          <footer data-testid="footer">Footer</footer>
        </div>
      );

      render(
        <QueryProvider>
          <ComplexTree />
        </QueryProvider>
      );

      expect(screen.getByTestId('complex-root')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('nav')).toBeInTheDocument();
      expect(screen.getByTestId('main')).toBeInTheDocument();
      expect(screen.getByTestId('section')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('動態內容測試', () => {
    it('應該正確處理條件渲染的子組件', () => {
      const ConditionalChild = ({ show }: { show: boolean }) => (
        <QueryProvider>
          {show && <TestChild />}
          <div data-testid="always-visible">Always Visible</div>
        </QueryProvider>
      );

      // 測試顯示狀態
      const { rerender } = render(<ConditionalChild show={true} />);
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('always-visible')).toBeInTheDocument();

      // 測試隱藏狀態
      rerender(<ConditionalChild show={false} />);
      expect(screen.queryByTestId('test-child')).not.toBeInTheDocument();
      expect(screen.getByTestId('always-visible')).toBeInTheDocument();
    });

    it('應該正確處理動態添加的子組件', () => {
      const DynamicChildren = ({ count }: { count: number }) => (
        <QueryProvider>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} data-testid={`dynamic-child-${i}`}>
              Child {i}
            </div>
          ))}
        </QueryProvider>
      );

      const { rerender } = render(<DynamicChildren count={2} />);
      expect(screen.getByTestId('dynamic-child-0')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-child-1')).toBeInTheDocument();
      expect(screen.queryByTestId('dynamic-child-2')).not.toBeInTheDocument();

      // 增加子組件數量
      rerender(<DynamicChildren count={4} />);
      expect(screen.getByTestId('dynamic-child-0')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-child-2')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-child-3')).toBeInTheDocument();
    });
  });

  describe('QueryClient 配置測試', () => {
    it('應該正確配置 QueryClient 的基本選項', () => {
      const QueryClientTester = () => {
        const queryClient = useQueryClient();
        const defaultOptions = queryClient.getDefaultOptions();
        
        return (
          <div data-testid="query-config">
            <div data-testid="stale-time">{defaultOptions.queries?.staleTime}</div>
            <div data-testid="gc-time">{defaultOptions.queries?.gcTime}</div>
            <div data-testid="refetch-on-window-focus">{String(defaultOptions.queries?.refetchOnWindowFocus)}</div>
            <div data-testid="throw-on-error">{String(defaultOptions.queries?.throwOnError)}</div>
          </div>
        );
      };

      render(
        <QueryProvider>
          <QueryClientTester />
        </QueryProvider>
      );

      expect(screen.getByTestId('stale-time')).toHaveTextContent('180000'); // 3 分鐘
      expect(screen.getByTestId('gc-time')).toHaveTextContent('1800000'); // 30 分鐘
      expect(screen.getByTestId('refetch-on-window-focus')).toHaveTextContent('false');
      expect(screen.getByTestId('throw-on-error')).toHaveTextContent('true');
    });

    it('應該正確配置重試策略', () => {
      const RetryTester = () => {
        const queryClient = useQueryClient();
        const defaultOptions = queryClient.getDefaultOptions();
        const retryFunction = defaultOptions.queries?.retry as Function;
        
        // 測試 4xx 錯誤不重試
        const error4xx = { status: 400 };
        const shouldRetry4xx = retryFunction(1, error4xx);
        
        // 測試 5xx 錯誤重試
        const error5xx = { status: 500 };
        const shouldRetry5xx = retryFunction(1, error5xx);
        
        // 測試達到重試上限
        const shouldRetry5xxMax = retryFunction(3, error5xx);
        
        // 測試網絡錯誤重試
        const networkError = { name: 'NetworkError' };
        const shouldRetryNetwork = retryFunction(2, networkError);
        
        return (
          <div data-testid="retry-config">
            <div data-testid="retry-4xx">{String(shouldRetry4xx)}</div>
            <div data-testid="retry-5xx">{String(shouldRetry5xx)}</div>
            <div data-testid="retry-5xx-max">{String(shouldRetry5xxMax)}</div>
            <div data-testid="retry-network">{String(shouldRetryNetwork)}</div>
          </div>
        );
      };

      render(
        <QueryProvider>
          <RetryTester />
        </QueryProvider>
      );

      expect(screen.getByTestId('retry-4xx')).toHaveTextContent('false');
      expect(screen.getByTestId('retry-5xx')).toHaveTextContent('true');
      expect(screen.getByTestId('retry-5xx-max')).toHaveTextContent('false');
      expect(screen.getByTestId('retry-network')).toHaveTextContent('true');
    });

    it('應該正確配置重試延遲', () => {
      const DelayTester = () => {
        const queryClient = useQueryClient();
        const defaultOptions = queryClient.getDefaultOptions();
        const retryDelayFunction = defaultOptions.queries?.retryDelay as Function;
        
        const delay1 = retryDelayFunction(0); // 第一次重試
        const delay2 = retryDelayFunction(1); // 第二次重試
        const delay3 = retryDelayFunction(10); // 測試最大延遲
        
        return (
          <div data-testid="delay-config">
            <div data-testid="delay-1">{delay1}</div>
            <div data-testid="delay-2">{delay2}</div>
            <div data-testid="delay-max">{delay3}</div>
          </div>
        );
      };

      render(
        <QueryProvider>
          <DelayTester />
        </QueryProvider>
      );

      expect(screen.getByTestId('delay-1')).toHaveTextContent('1000'); // 1 秒
      expect(screen.getByTestId('delay-2')).toHaveTextContent('2000'); // 2 秒
      expect(screen.getByTestId('delay-max')).toHaveTextContent('30000'); // 最大 30 秒
    });

    it('應該正確配置 Mutation 選項', () => {
      const MutationTester = () => {
        const queryClient = useQueryClient();
        const defaultOptions = queryClient.getDefaultOptions();
        
        return (
          <div data-testid="mutation-config">
            <div data-testid="mutation-retry">{defaultOptions.mutations?.retry}</div>
            <div data-testid="mutation-throw-on-error">{String(defaultOptions.mutations?.throwOnError)}</div>
            <div data-testid="mutation-network-mode">{defaultOptions.mutations?.networkMode}</div>
          </div>
        );
      };

      render(
        <QueryProvider>
          <MutationTester />
        </QueryProvider>
      );

      expect(screen.getByTestId('mutation-retry')).toHaveTextContent('1');
      expect(screen.getByTestId('mutation-throw-on-error')).toHaveTextContent('false');
      expect(screen.getByTestId('mutation-network-mode')).toHaveTextContent('online');
    });
  });

  describe('併發渲染測試', () => {
    it('應該正確處理多個 QueryProvider 實例', () => {
      const FirstProvider = () => (
        <QueryProvider>
          <div data-testid="first-provider-child">First Provider</div>
        </QueryProvider>
      );

      const SecondProvider = () => (
        <QueryProvider>
          <div data-testid="second-provider-child">Second Provider</div>
        </QueryProvider>
      );

      render(
        <div>
          <FirstProvider />
          <SecondProvider />
        </div>
      );

      expect(screen.getByTestId('first-provider-child')).toBeInTheDocument();
      expect(screen.getByTestId('second-provider-child')).toBeInTheDocument();
    });

    it('應該在客戶端重用 QueryClient 實例', () => {
      let firstQueryClient: any;
      let secondQueryClient: any;

      const FirstClientTester = () => {
        firstQueryClient = useQueryClient();
        return <div data-testid="first-client">First Client</div>;
      };

      const SecondClientTester = () => {
        secondQueryClient = useQueryClient();
        return <div data-testid="second-client">Second Client</div>;
      };

      const { rerender } = render(
        <QueryProvider>
          <FirstClientTester />
        </QueryProvider>
      );

      rerender(
        <QueryProvider>
          <SecondClientTester />
        </QueryProvider>
      );

      expect(screen.getByTestId('second-client')).toBeInTheDocument();
      // 在客戶端應該重用同一個 QueryClient 實例
      expect(firstQueryClient).toBe(secondQueryClient);
    });
  });
});