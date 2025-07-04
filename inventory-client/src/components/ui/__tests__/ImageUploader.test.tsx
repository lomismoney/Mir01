/**
 * ImageUploader 組件測試套件
 * 測試圖片上傳的各種功能，包括拖拽、文件驗證、預覽等
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploader } from '../ImageUploader';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ImageUploader', () => {
  const mockOnUpload = jest.fn();
  const mockOnUploadSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該渲染默認的上傳區域', () => {
      render(<ImageUploader onUpload={mockOnUpload} />);

      expect(screen.getByText('商品圖片')).toBeInTheDocument();
      expect(screen.getByText('點擊上傳圖片')).toBeInTheDocument();
      expect(screen.getByText('或拖拽圖片文件到此區域')).toBeInTheDocument();
      expect(screen.getByText('支援 JPEG、PNG、GIF、WebP 格式，最大 10MB')).toBeInTheDocument();
    });

    it('應該顯示自定義標籤和提示文字', () => {
      render(
        <ImageUploader
          onUpload={mockOnUpload}
          label="產品封面"
          helperText="請上傳高品質圖片"
        />
      );

      expect(screen.getByText('產品封面')).toBeInTheDocument();
      expect(screen.getByText('請上傳高品質圖片')).toBeInTheDocument();
    });

    it('應該在有現有圖片時顯示圖片', () => {
      render(
        <ImageUploader
          onUpload={mockOnUpload}
          currentImageUrl="https://example.com/image.jpg"
        />
      );

      const image = screen.getByAltText('商品圖片預覽');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(screen.getByText('點擊更換圖片')).toBeInTheDocument();
    });

    it('應該在禁用狀態下正確渲染', () => {
      render(<ImageUploader onUpload={mockOnUpload} disabled />);

      const uploadArea = screen.getByRole('button');
      expect(uploadArea).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('文件選擇功能', () => {
    it('應該能夠通過文件輸入選擇文件', async () => {
      render(<ImageUploader onUpload={mockOnUpload} />);

      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByDisplayValue('');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalledWith(file);
        expect(screen.getByText('確認上傳')).toBeInTheDocument();
      });
    });

    it('應該能夠處理鍵盤事件', async () => {
      const user = userEvent.setup();
      render(<ImageUploader onUpload={mockOnUpload} />);

      const uploadArea = screen.getByRole('button');
      
      uploadArea.focus();
      await user.keyboard('{Enter}');
      
      expect(uploadArea).toBeInTheDocument();
    });
  });

  describe('拖拽功能', () => {
    const createDragEvent = (type: string, files: File[] = []) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, 'dataTransfer', {
        value: {
          files,
        },
        writable: false,
      });
      return event;
    };

    it('應該處理拖拽懸停效果', () => {
      render(<ImageUploader onUpload={mockOnUpload} />);

      const uploadArea = screen.getByRole('button');
      
      fireEvent.dragOver(uploadArea);
      fireEvent.dragLeave(uploadArea);
      
      expect(uploadArea).toBeInTheDocument();
    });

    it('應該處理文件拖拽放置', async () => {
      render(<ImageUploader onUpload={mockOnUpload} />);

      const uploadArea = screen.getByRole('button');
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      
      const dropEvent = createDragEvent('drop', [file]);
      fireEvent(uploadArea, dropEvent);

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalledWith(file);
        expect(screen.getByText('確認上傳')).toBeInTheDocument();
      });
    });

    it('應該在禁用狀態下不響應拖拽', () => {
      render(<ImageUploader onUpload={mockOnUpload} disabled />);

      const uploadArea = screen.getByRole('button');
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      
      const dropEvent = createDragEvent('drop', [file]);
      fireEvent(uploadArea, dropEvent);
      
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('文件驗證', () => {
    it('應該拒絕無效的文件格式', async () => {
      render(<ImageUploader onUpload={mockOnUpload} />);

      const invalidFile = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByDisplayValue('');

      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          '不支援的文件格式。請選擇 JPEG、PNG、GIF 或 WebP 格式的圖片。'
        );
      });
      
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('應該拒絕超過大小限制的文件', async () => {
      render(<ImageUploader onUpload={mockOnUpload} />);

      const largeFile = new File(['dummy content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', {
        value: 11 * 1024 * 1024, // 11MB
        writable: false,
      });

      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          '文件太大。圖片大小不能超過 10MB。'
        );
      });
    });
  });

  describe('圖片預覽功能', () => {
    it('應該顯示選中文件的預覽', async () => {
      render(<ImageUploader onUpload={mockOnUpload} />);

      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByDisplayValue('');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const previewImage = screen.getByAltText('商品圖片預覽');
        expect(previewImage).toBeInTheDocument();
        expect(previewImage).toHaveAttribute('src', 'blob:mock-url');
      });
    });

    it('應該處理圖片載入錯誤', () => {
      render(
        <ImageUploader
          onUpload={mockOnUpload}
          currentImageUrl="https://invalid-url.com/broken.jpg"
        />
      );

      const image = screen.getByAltText('商品圖片預覽');
      fireEvent.error(image);

      expect(image).toBeInTheDocument();
    });
  });

  describe('上傳功能', () => {
    it('應該成功處理文件上傳', async () => {
      const user = userEvent.setup();
      mockOnUpload.mockResolvedValue(undefined);

      render(
        <ImageUploader
          onUpload={mockOnUpload}
          onUploadSuccess={mockOnUploadSuccess}
        />
      );

      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByDisplayValue('');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('確認上傳')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('確認上傳');
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file);
        expect(toast.success).toHaveBeenCalledWith('圖片上傳成功！正在處理中...');
      });
    });

    it('應該處理上傳錯誤', async () => {
      const user = userEvent.setup();
      const errorMessage = '上傳失敗：服務器錯誤';
      mockOnUpload.mockRejectedValue(new Error(errorMessage));

      render(<ImageUploader onUpload={mockOnUpload} />);

      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByDisplayValue('');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('確認上傳')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('確認上傳');
      await user.click(uploadButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    it('應該防止重複上傳', async () => {
      const user = userEvent.setup();
      mockOnUpload.mockImplementation(() => new Promise(() => {})); // 永不解決

      render(<ImageUploader onUpload={mockOnUpload} />);

      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByDisplayValue('');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('確認上傳')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('確認上傳');
      await user.click(uploadButton);
      await user.click(uploadButton); // 第二次點擊

      expect(mockOnUpload).toHaveBeenCalledTimes(1);
    });
  });

  describe('記憶體清理', () => {
    it('應該在組件卸載時清理 blob URL', () => {
      const { unmount } = render(<ImageUploader onUpload={mockOnUpload} />);

      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { files: [file] } });

      unmount();

      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('邊界情況處理', () => {
    it('應該處理空的文件列表', () => {
      render(<ImageUploader onUpload={mockOnUpload} />);

      const uploadArea = screen.getByRole('button');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [] },
        writable: false,
      });

      fireEvent(uploadArea, dropEvent);

      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('應該處理沒有錯誤消息的上傳失敗', async () => {
      const user = userEvent.setup();
      mockOnUpload.mockRejectedValue(new Error());

      render(<ImageUploader onUpload={mockOnUpload} />);

      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByDisplayValue('');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('確認上傳')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('確認上傳');
      await user.click(uploadButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('圖片上傳失敗，請重試。');
      });
    });
  });
}); 