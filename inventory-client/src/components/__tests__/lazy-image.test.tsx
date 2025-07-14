import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LazyImage } from '@/components/ui/lazy-image';
import '@testing-library/jest-dom';

// 模擬 Intersection Observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// 模擬 URL.createObjectURL
global.URL.createObjectURL = jest.fn();

describe('LazyImage', () => {
  beforeEach(() => {
    mockIntersectionObserver.mockClear();
  });

  it('should render placeholder initially', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        placeholder="shimmer"
      />
    );

    // 應該顯示佔位符
    const container = screen.getByRole('img', { name: 'Test image' }).parentElement;
    expect(container).toBeInTheDocument();
  });

  it('should render image when priority is true', async () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    // 優先級圖片應該立即開始載入
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Test image' })).toBeInTheDocument();
    });
  });

  it('should handle image load error', async () => {
    // 模擬圖片載入失敗
    const mockImage = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      src: '',
    };
    
    jest.spyOn(window, 'Image').mockImplementation(() => mockImage as any);

    render(
      <LazyImage
        src="https://example.com/broken-image.jpg"
        alt="Broken image"
        fallbackSrc="https://example.com/fallback.jpg"
      />
    );

    // 觸發錯誤事件
    const errorCallback = mockImage.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )?.[1];
    
    if (errorCallback) {
      errorCallback();
    }

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
    });
  });

  it('should apply correct object-fit class', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        objectFit="contain"
        priority={true}
      />
    );

    const image = screen.getByRole('img', { name: 'Test image' });
    expect(image).toHaveClass('object-contain');
  });

  it('should respect custom dimensions', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        width={200}
        height={150}
      />
    );

    const container = screen.getByRole('img', { name: 'Test image' }).parentElement;
    expect(container).toHaveStyle({
      width: '200px',
      height: '150px',
    });
  });
});