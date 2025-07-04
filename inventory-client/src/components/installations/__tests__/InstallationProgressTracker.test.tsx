import React from 'react';
import { render, screen } from '@testing-library/react';
import { InstallationProgressTracker } from '../InstallationProgressTracker';
import { InstallationWithRelations, InstallationStatus } from '@/types/installation';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatString) => {
    if (formatString === "MM/dd HH:mm") return '12/01 10:30';
    if (formatString === "MM/dd") return '12/01';
    if (formatString === "yyyy/MM/dd HH:mm") return '2023/12/01 10:30';
    return '2023-12-01';
  }),
}));

jest.mock('date-fns/locale', () => ({
  zhTW: {},
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('InstallationProgressTracker', () => {
  const baseInstallation = {
    id: 1,
    status: 'pending' as InstallationStatus,
    priority: 'normal',
    installation_type: 'normal',
    notes: '',
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2023-12-01T10:00:00Z',
    scheduled_date: null,
    actual_start_time: null,
    actual_end_time: null,
    installer: {
      id: 1,
      name: '張師傅',
      username: 'zhang_master',
    },
    customer: {
      id: 1,
      name: '測試客戶',
      phone: '0912345678',
      email: 'test@example.com',
    },
    installation_items: [],
  } as any;

  describe('基本渲染', () => {
    it('應該正確渲染緊湊版本', () => {
      render(<InstallationProgressTracker installation={baseInstallation} />);

      // 檢查階段標籤
      expect(screen.getByText('待排程')).toBeInTheDocument();
      expect(screen.getByText('已排程')).toBeInTheDocument();
      expect(screen.getByText('進行中')).toBeInTheDocument();
      expect(screen.getByText('已完成')).toBeInTheDocument();
    });

    it('應該正確渲染完整版本', () => {
      render(<InstallationProgressTracker installation={baseInstallation} variant="full" />);

      // 檢查階段標籤
      expect(screen.getByText('待排程')).toBeInTheDocument();
      expect(screen.getByText('已排程')).toBeInTheDocument();
      expect(screen.getByText('進行中')).toBeInTheDocument();
      expect(screen.getByText('已完成')).toBeInTheDocument();

      // 檢查描述文字
      expect(screen.getByText('安裝單已建立')).toBeInTheDocument();
      expect(screen.getByText('分配給 張師傅')).toBeInTheDocument();
      expect(screen.getByText('安裝作業執行中')).toBeInTheDocument();
      expect(screen.getByText('安裝作業完成')).toBeInTheDocument();
    });

    it('應該顯示正確的圖標', () => {
      render(<InstallationProgressTracker installation={baseInstallation} />);

      // 檢查是否包含圖標文字
      expect(screen.getByText('📋')).toBeInTheDocument();
      expect(screen.getByText('📅')).toBeInTheDocument();
      expect(screen.getByText('🚧')).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });
  });

  describe('狀態顯示', () => {
    it('應該正確顯示 pending 狀態', () => {
      const installation = {
        ...baseInstallation,
        status: 'pending' as InstallationStatus,
      };

      render(<InstallationProgressTracker installation={installation} />);

      // pending 階段應該是活動的
      expect(screen.getByText('待排程')).toBeInTheDocument();
    });

    it('應該正確顯示 scheduled 狀態', () => {
      const installation = {
        ...baseInstallation,
        status: 'scheduled' as InstallationStatus,
        scheduled_date: '2023-12-02T09:00:00Z',
      };

      render(<InstallationProgressTracker installation={installation} />);

      expect(screen.getByText('已排程')).toBeInTheDocument();
    });

    it('應該正確顯示 in_progress 狀態', () => {
      const installation = {
        ...baseInstallation,
        status: 'in_progress' as InstallationStatus,
        scheduled_date: '2023-12-02T09:00:00Z',
        actual_start_time: '2023-12-02T09:30:00Z',
      };

      render(<InstallationProgressTracker installation={installation} />);

      expect(screen.getByText('進行中')).toBeInTheDocument();
    });

    it('應該正確顯示 completed 狀態', () => {
      const installation = {
        ...baseInstallation,
        status: 'completed' as InstallationStatus,
        scheduled_date: '2023-12-02T09:00:00Z',
        actual_start_time: '2023-12-02T09:30:00Z',
        actual_end_time: '2023-12-02T12:00:00Z',
      };

      render(<InstallationProgressTracker installation={installation} />);

      expect(screen.getByText('已完成')).toBeInTheDocument();
    });

    it('應該正確顯示 cancelled 狀態', () => {
      const installation = {
        ...baseInstallation,
        status: 'cancelled' as InstallationStatus,
      };

      render(<InstallationProgressTracker installation={installation} />);

      expect(screen.getByText('已取消')).toBeInTheDocument();
      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  describe('時間顯示', () => {
    it('應該在緊湊版本中顯示格式化時間', () => {
      const installation = {
        ...baseInstallation,
        status: 'in_progress' as InstallationStatus,
        scheduled_date: '2023-12-02T09:00:00Z',
        actual_start_time: '2023-12-02T09:30:00Z',
      };

      render(<InstallationProgressTracker installation={installation} variant="compact" />);

      // 檢查是否有格式化的時間顯示
      const timeElements = screen.getAllByText('12/01');
      expect(timeElements.length).toBeGreaterThanOrEqual(1);
    });

    it('應該在完整版本中顯示詳細時間', () => {
      const installation = {
        ...baseInstallation,
        status: 'scheduled' as InstallationStatus,
        scheduled_date: '2023-12-02T09:00:00Z',
      };

      render(<InstallationProgressTracker installation={installation} variant="full" />);

      // 檢查是否有詳細時間顯示
      const detailTimeElements = screen.getAllByText('2023/12/01 10:30');
      expect(detailTimeElements.length).toBeGreaterThanOrEqual(1);
    });

    it('應該對沒有時間的階段顯示佔位符', () => {
      render(<InstallationProgressTracker installation={baseInstallation} variant="compact" />);

      // 檢查是否有時間佔位符
      const placeholderElements = screen.getAllByText('--/--');
      expect(placeholderElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('安裝師傅顯示', () => {
    it('應該顯示分配的師傅名稱', () => {
             const installation = {
         ...baseInstallation,
         status: 'scheduled' as InstallationStatus,
         installer: {
           id: 1,
           name: '李師傅',
         },
       } as any;

      render(<InstallationProgressTracker installation={installation} variant="full" />);

      expect(screen.getByText('分配給 李師傅')).toBeInTheDocument();
    });

    it('應該在沒有師傅時顯示等待分配', () => {
             const installation = {
         ...baseInstallation,
         status: 'scheduled' as InstallationStatus,
         installer: null,
       } as any;

      render(<InstallationProgressTracker installation={installation} variant="full" />);

      expect(screen.getByText('等待分配師傅')).toBeInTheDocument();
    });
  });

  describe('進度視覺效果', () => {
    it('應該在緊湊版本中顯示進度條', () => {
      const installation = {
        ...baseInstallation,
        status: 'in_progress' as InstallationStatus,
        scheduled_date: '2023-12-02T09:00:00Z',
        actual_start_time: '2023-12-02T09:30:00Z',
      };

      const { container } = render(
        <InstallationProgressTracker installation={installation} variant="compact" />
      );

      // 檢查是否有圓點元素
      const circles = container.querySelectorAll('.rounded-full');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('應該在完整版本中顯示垂直時間軸', () => {
      const installation = {
        ...baseInstallation,
        status: 'scheduled' as InstallationStatus,
        scheduled_date: '2023-12-02T09:00:00Z',
      };

      const { container } = render(
        <InstallationProgressTracker installation={installation} variant="full" />
      );

      // 檢查是否有時間軸線條
      expect(container.querySelector('.w-0\\.5')).toBeInTheDocument();
    });
  });

  describe('已完成狀態的特殊顯示', () => {
    it('應該在已完成的階段顯示勾選標記', () => {
      const installation = {
        ...baseInstallation,
        status: 'completed' as InstallationStatus,
        scheduled_date: '2023-12-02T09:00:00Z',
        actual_start_time: '2023-12-02T09:30:00Z',
        actual_end_time: '2023-12-02T12:00:00Z',
      };

      render(<InstallationProgressTracker installation={installation} />);

      // 檢查是否有勾選標記
      const checkMarks = screen.getAllByText('✓');
      expect(checkMarks.length).toBeGreaterThan(0);
    });
  });

  describe('無師傅情況', () => {
    it('應該正確處理沒有 installer 的情況', () => {
      const installation = {
        ...baseInstallation,
        installer: undefined,
      } as any;

      render(<InstallationProgressTracker installation={installation} variant="full" />);

      expect(screen.getByText('等待分配師傅')).toBeInTheDocument();
    });
  });

  describe('空時間處理', () => {
    it('應該正確處理沒有時間的階段', () => {
      const installation = {
        ...baseInstallation,
        created_at: null,
        scheduled_date: null,
        actual_start_time: null,
        actual_end_time: null,
      } as any;

      render(<InstallationProgressTracker installation={installation} />);

      // 組件應該仍然能正常渲染
      expect(screen.getByText('待排程')).toBeInTheDocument();
    });
  });

  describe('CSS 類別應用', () => {
    it('應該正確應用樣式類別', () => {
      const { container } = render(
        <InstallationProgressTracker installation={baseInstallation} />
      );

      // 檢查是否有基本的容器類別
      expect(container.querySelector('.w-full')).toBeInTheDocument();
      expect(container.querySelector('.space-y-3')).toBeInTheDocument();
    });

    it('應該在取消狀態下應用特殊樣式', () => {
      const installation = {
        ...baseInstallation,
        status: 'cancelled' as InstallationStatus,
      };

      const { container } = render(
        <InstallationProgressTracker installation={installation} />
      );

      // 檢查取消狀態的特殊樣式
      expect(container.querySelector('.bg-destructive\\/10')).toBeInTheDocument();
    });
  });

  describe('響應式設計', () => {
    it('應該包含響應式元素', () => {
      const { container } = render(
        <InstallationProgressTracker installation={baseInstallation} variant="compact" />
      );

      // 檢查是否有 flex 佈局相關的類別
      expect(container.querySelector('.flex')).toBeInTheDocument();
    });
  });
}); 