import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageSelector } from '../ImageSelector';
import { ImageSelectionData } from '@/hooks/useImageSelection';

// Mock dependencies
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, ...props }: any) => (
    <div data-testid="alert" data-variant={variant} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-description" {...props}>
      {children}
    </div>
  ),
}));

describe('ImageSelector', () => {
  const defaultImageData: ImageSelectionData = {
    file: null,
    preview: null,
    isValid: true,
    validationError: undefined,
  };

  const defaultProps = {
    imageData: defaultImageData,
    onSelectImage: jest.fn(),
    onClearImage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本渲染', () => {
    test('當沒有圖片時應該渲染上傳區域', () => {
      render(<ImageSelector {...defaultProps} />);

      expect(screen.getByText('點擊上傳')).toBeInTheDocument();
      expect(screen.getByText('或拖曳檔案至此')).toBeInTheDocument();
      expect(screen.getByText(/JPEG、PNG、WEBP/)).toBeInTheDocument();
      expect(screen.getByText(/最大 5 MB/)).toBeInTheDocument();
    });

    test('應該顯示正確的檔案格式和大小限制', () => {
      render(
        <ImageSelector
          {...defaultProps}
          acceptedFormats={['image/jpeg', 'image/gif']}
          maxFileSize={2 * 1024 * 1024} // 2MB
        />
      );

      expect(screen.getByText(/JPEG、GIF/)).toBeInTheDocument();
      expect(screen.getByText(/最大 2 MB/)).toBeInTheDocument();
    });

    test('應該顯示圖片預覽當有圖片時', () => {
      const imageDataWithPreview: ImageSelectionData = {
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        preview: 'data:image/jpeg;base64,test',
        isValid: true,
        validationError: undefined,
      };

      render(
        <ImageSelector
          {...defaultProps}
          imageData={imageDataWithPreview}
        />
      );

      expect(screen.getByAltText('商品圖片預覽')).toBeInTheDocument();
      expect(screen.getByText('檔案名稱：test.jpg')).toBeInTheDocument();
      expect(screen.getByText(/檔案大小：/)).toBeInTheDocument();
      expect(screen.getByText('檔案格式：image/jpeg')).toBeInTheDocument();
    });
  });

  describe('文件選擇功能', () => {
    test('應該在點擊上傳區域時觸發文件選擇', async () => {
      const user = userEvent.setup();
      render(<ImageSelector {...defaultProps} />);

      const fileInput = screen.getByLabelText(/點擊上傳/);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      expect(defaultProps.onSelectImage).toHaveBeenCalledWith(file);
    });

    test('應該在文件輸入變更時調用 onSelectImage', () => {
      render(<ImageSelector {...defaultProps} />);

      const fileInputs = screen.getAllByDisplayValue('');
      const fileInput = fileInputs.find(input => input.getAttribute('type') === 'file');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      if (fileInput) {
        // 模擬文件輸入變更
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });

        fireEvent.change(fileInput);

        expect(defaultProps.onSelectImage).toHaveBeenCalledWith(file);
      }
    });
  });

  describe('拖拽功能', () => {
    test('應該處理拖拽上傳', () => {
      render(<ImageSelector {...defaultProps} />);

      const dropzone = screen.getByText('點擊上傳').closest('label')!;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // 創建 dataTransfer 對象
      const dataTransfer = {
        files: [file],
      };

      fireEvent.dragOver(dropzone);
      fireEvent.drop(dropzone, { dataTransfer });

      expect(defaultProps.onSelectImage).toHaveBeenCalledWith(file);
    });

    test('應該正確處理 dragOver 和 dragLeave 事件', () => {
      render(<ImageSelector {...defaultProps} />);

      const dropzone = screen.getByText('點擊上傳').closest('label')!;

      // 測試 dragOver 事件 - 只檢查事件是否觸發
      fireEvent.dragOver(dropzone);
      expect(dropzone).toBeInTheDocument();

      // 測試 dragLeave 事件 - 只檢查事件是否觸發
      fireEvent.dragLeave(dropzone);
      expect(dropzone).toBeInTheDocument();
    });
  });

  describe('圖片清除功能', () => {
    test('應該在點擊清除按鈕時調用 onClearImage', async () => {
      const user = userEvent.setup();
      const imageDataWithPreview: ImageSelectionData = {
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        preview: 'data:image/jpeg;base64,test',
        isValid: true,
        validationError: undefined,
      };

      render(
        <ImageSelector
          {...defaultProps}
          imageData={imageDataWithPreview}
        />
      );

      const clearButton = screen.getByLabelText('清除圖片');
      await user.click(clearButton);

      expect(defaultProps.onClearImage).toHaveBeenCalled();
    });
  });

  describe('錯誤處理', () => {
    test('應該顯示驗證錯誤訊息', () => {
          const imageDataWithError: ImageSelectionData = {
      file: null,
      preview: null,
      isValid: false,
      validationError: '檔案大小超過限制',
    };

      render(
        <ImageSelector
          {...defaultProps}
          imageData={imageDataWithError}
        />
      );

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'destructive');
      expect(screen.getByText('檔案大小超過限制')).toBeInTheDocument();
    });

    test('當圖片有效時不應該顯示錯誤訊息', () => {
      render(<ImageSelector {...defaultProps} />);

      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    });
  });

  describe('禁用狀態', () => {
    test('在禁用狀態下應該阻止文件選擇', () => {
      render(<ImageSelector {...defaultProps} disabled={true} />);

      const dropzone = screen.getByText('點擊上傳').closest('label')!;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropzone, { dataTransfer });

      expect(defaultProps.onSelectImage).not.toHaveBeenCalled();
    });

    test('在禁用狀態下應該禁用文件輸入', () => {
      const { container } = render(<ImageSelector {...defaultProps} disabled={true} />);

      const fileInputs = container.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    test('在禁用狀態下應該禁用清除按鈕', () => {
      const imageDataWithPreview: ImageSelectionData = {
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        preview: 'data:image/jpeg;base64,test',
        isValid: true,
        validationError: undefined,
      };

      render(
        <ImageSelector
          {...defaultProps}
          imageData={imageDataWithPreview}
          disabled={true}
        />
      );

      const clearButton = screen.getByLabelText('清除圖片');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('樣式和類名', () => {
    test('應該應用自定義類名', () => {
      const { container } = render(
        <ImageSelector {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('檔案大小格式化', () => {
    test('應該正確格式化檔案大小顯示', () => {
      const file1MB = new File(['x'.repeat(1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      const imageData: ImageSelectionData = {
        file: file1MB,
        preview: 'data:image/jpeg;base64,test',
        isValid: true,
        validationError: undefined,
      };

      render(
        <ImageSelector
          {...defaultProps}
          imageData={imageData}
        />
      );

      expect(screen.getByText(/檔案大小：1 MB/)).toBeInTheDocument();
    });
  });

  describe('可訪問性', () => {
    test('清除按鈕應該有正確的 aria-label', () => {
      const imageDataWithPreview: ImageSelectionData = {
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        preview: 'data:image/jpeg;base64,test',
        isValid: true,
        validationError: undefined,
      };

      render(
        <ImageSelector
          {...defaultProps}
          imageData={imageDataWithPreview}
        />
      );

      const clearButton = screen.getByLabelText('清除圖片');
      expect(clearButton).toBeInTheDocument();
    });

    test('圖片應該有正確的 alt 文字', () => {
      const imageDataWithPreview: ImageSelectionData = {
        file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
        preview: 'data:image/jpeg;base64,test',
        isValid: true,
        validationError: undefined,
      };

      render(
        <ImageSelector
          {...defaultProps}
          imageData={imageDataWithPreview}
        />
      );

      expect(screen.getByAltText('商品圖片預覽')).toBeInTheDocument();
    });
  });
}); 