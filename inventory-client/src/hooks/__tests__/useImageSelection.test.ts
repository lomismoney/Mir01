import { renderHook, act } from '@testing-library/react';
import { useImageSelection } from '../useImageSelection';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock Image constructor
class MockImage {
  onload: ((ev: Event) => any) | null = null;
  onerror: ((ev: ErrorEvent) => any) | null = null;
  src = '';
  width = 100;
  height = 100;

  constructor() {
    // Simulate successful image load after a short delay
    setTimeout(() => {
      if (this.onload) {
        this.onload({} as Event);
      }
    }, 0);
  }
}

global.Image = MockImage as any;

/**
 * 創建模擬的檔案物件
 * 
 * @param name - 檔案名稱
 * @param size - 檔案大小（bytes）
 * @param type - MIME 類型
 * @returns 模擬的 File 物件
 */
const createMockFile = (name: string, size: number, type: string): File => {
  const mockFile = new Blob([''], { type }) as File;
  Object.defineProperty(mockFile, 'name', { value: name });
  Object.defineProperty(mockFile, 'size', { value: size });
  Object.defineProperty(mockFile, 'type', { value: type });
  return mockFile;
};

describe('useImageSelection', () => {
  const mockCreateObjectURL = URL.createObjectURL as jest.MockedFunction<typeof URL.createObjectURL>;
  const mockRevokeObjectURL = URL.revokeObjectURL as jest.MockedFunction<typeof URL.revokeObjectURL>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('應該初始化為空狀態', () => {
    const { result } = renderHook(() => useImageSelection());

    expect(result.current.imageData).toEqual({
      file: null,
      preview: null,
      isValid: true,
    });
  });

  describe('selectImage', () => {
    it('應該成功選擇有效的圖片檔案', async () => {
      const { result } = renderHook(() => useImageSelection());
      const validFile = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg'); // 1MB

      await act(async () => {
        await result.current.selectImage(validFile);
      });

      expect(result.current.imageData).toEqual({
        file: validFile,
        preview: 'blob:mock-url',
        isValid: true,
      });

      expect(mockCreateObjectURL).toHaveBeenCalledWith(validFile);
    });

    it('應該拒絕過大的檔案', async () => {
      const { result } = renderHook(() => useImageSelection());
      const oversizedFile = createMockFile('huge.jpg', 6 * 1024 * 1024, 'image/jpeg'); // 6MB

      await act(async () => {
        await result.current.selectImage(oversizedFile);
      });

      expect(result.current.imageData).toEqual({
        file: null,
        preview: null,
        isValid: false,
        validationError: '圖片大小不能超過 5MB',
      });

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('應該拒絕不支援的檔案格式', async () => {
      const { result } = renderHook(() => useImageSelection());
      const unsupportedFile = createMockFile('test.gif', 1024, 'image/gif');

      await act(async () => {
        await result.current.selectImage(unsupportedFile);
      });

      expect(result.current.imageData).toEqual({
        file: null,
        preview: null,
        isValid: false,
        validationError: '僅支援 JPEG、PNG、WebP 格式',
      });

      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('應該支援 PNG 格式', async () => {
      const { result } = renderHook(() => useImageSelection());
      const pngFile = createMockFile('test.png', 1024, 'image/png');

      await act(async () => {
        await result.current.selectImage(pngFile);
      });

      expect(result.current.imageData.isValid).toBe(true);
      expect(result.current.imageData.file).toBe(pngFile);
    });

    it('應該支援 WebP 格式', async () => {
      const { result } = renderHook(() => useImageSelection());
      const webpFile = createMockFile('test.webp', 1024, 'image/webp');

      await act(async () => {
        await result.current.selectImage(webpFile);
      });

      expect(result.current.imageData.isValid).toBe(true);
      expect(result.current.imageData.file).toBe(webpFile);
    });

    it('應該在選擇新檔案時清理舊的預覽 URL', async () => {
      const { result } = renderHook(() => useImageSelection());
      const file1 = createMockFile('test1.jpg', 1024, 'image/jpeg');
      const file2 = createMockFile('test2.jpg', 1024, 'image/jpeg');

      // 選擇第一個檔案
      await act(async () => {
        await result.current.selectImage(file1);
      });

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);

      // 選擇第二個檔案
      await act(async () => {
        await result.current.selectImage(file2);
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
    });

    it('應該在驗證失敗時清理現有的預覽 URL', async () => {
      const { result } = renderHook(() => useImageSelection());
      const validFile = createMockFile('valid.jpg', 1024, 'image/jpeg');
      const invalidFile = createMockFile('invalid.gif', 1024, 'image/gif');

      // 先選擇有效檔案
      await act(async () => {
        await result.current.selectImage(validFile);
      });

      expect(result.current.imageData.preview).toBe('blob:mock-url');

      // 然後選擇無效檔案
      await act(async () => {
        await result.current.selectImage(invalidFile);
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(result.current.imageData.preview).toBeNull();
    });
  });

  describe('clearImage', () => {
    it('應該清除圖片選擇並釋放預覽 URL', async () => {
      const { result } = renderHook(() => useImageSelection());
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');

      // 先選擇檔案
      await act(async () => {
        await result.current.selectImage(file);
      });

      expect(result.current.imageData.file).toBe(file);
      expect(result.current.imageData.preview).toBe('blob:mock-url');

      // 清除選擇
      act(() => {
        result.current.clearImage();
      });

      expect(result.current.imageData).toEqual({
        file: null,
        preview: null,
        isValid: true,
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('應該在沒有預覽 URL 時正常工作', () => {
      const { result } = renderHook(() => useImageSelection());

      act(() => {
        result.current.clearImage();
      });

      expect(result.current.imageData).toEqual({
        file: null,
        preview: null,
        isValid: true,
      });

      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('getImageMetadata', () => {
    it('應該在沒有檔案時返回 null', async () => {
      const { result } = renderHook(() => useImageSelection());

      let metadata;
      await act(async () => {
        metadata = await result.current.getImageMetadata();
      });

      expect(metadata).toBeNull();
    });

    it('應該成功獲取圖片元數據', async () => {
      const { result } = renderHook(() => useImageSelection());
      const file = createMockFile('test.jpg', 2048, 'image/jpeg');

      // 先選擇檔案
      await act(async () => {
        await result.current.selectImage(file);
      });

      let metadata;
      await act(async () => {
        metadata = await result.current.getImageMetadata();
      });

      expect(metadata).toEqual({
        originalSize: 2048,
        dimensions: { width: 100, height: 100 },
        format: 'image/jpeg',
      });
    });

    it('應該處理圖片載入錯誤', async () => {
      // 創建會失敗的 Image mock
      class FailingMockImage {
        onload: ((ev: Event) => any) | null = null;
        onerror: ((ev: ErrorEvent) => any) | null = null;
        src = '';

        constructor() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({} as ErrorEvent);
            }
          }, 0);
        }
      }

      global.Image = FailingMockImage as any;

      const { result } = renderHook(() => useImageSelection());
      const file = createMockFile('corrupted.jpg', 1024, 'image/jpeg');

      // 監控 console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // 先選擇檔案
      await act(async () => {
        await result.current.selectImage(file);
      });

      let metadata;
      await act(async () => {
        metadata = await result.current.getImageMetadata();
      });

      expect(metadata).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('獲取圖片元數據失敗:', {});

      consoleErrorSpy.mockRestore();
      // 恢復正常的 Image mock
      global.Image = MockImage as any;
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理恰好 5MB 的檔案', async () => {
      const { result } = renderHook(() => useImageSelection());
      const maxSizeFile = createMockFile('max.jpg', 5 * 1024 * 1024, 'image/jpeg');

      await act(async () => {
        await result.current.selectImage(maxSizeFile);
      });

      expect(result.current.imageData.isValid).toBe(true);
      expect(result.current.imageData.file).toBe(maxSizeFile);
    });

    it('應該拒絕超過 5MB 1 byte 的檔案', async () => {
      const { result } = renderHook(() => useImageSelection());
      const oversizedFile = createMockFile('over.jpg', 5 * 1024 * 1024 + 1, 'image/jpeg');

      await act(async () => {
        await result.current.selectImage(oversizedFile);
      });

      expect(result.current.imageData.isValid).toBe(false);
      expect(result.current.imageData.validationError).toBe('圖片大小不能超過 5MB');
    });

    it('應該處理零字節檔案', async () => {
      const { result } = renderHook(() => useImageSelection());
      const emptyFile = createMockFile('empty.jpg', 0, 'image/jpeg');

      await act(async () => {
        await result.current.selectImage(emptyFile);
      });

      expect(result.current.imageData.isValid).toBe(true);
      expect(result.current.imageData.file).toBe(emptyFile);
    });
  });
}); 