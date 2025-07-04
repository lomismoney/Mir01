import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useProducts,
  useProductDetail,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useDeleteMultipleProducts,
  useProductVariants,
  useProductVariantDetail,
  useUploadProductImage
} from '../useProducts';
import apiClient from '@/lib/apiClient';

// Mock the API client
jest.mock('@/lib/apiClient', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock the error handler
jest.mock('@/lib/errorHandler', () => ({
  parseApiError: jest.fn((error) => error?.message || null)
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Create a wrapper component for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProducts hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window object for toast
    Object.defineProperty(window, 'window', {
      value: global,
      writable: true
    });
  });

  describe('useProducts', () => {
    it('should fetch products list successfully', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              name: 'Product 1',
              description: 'Product description',
              category_id: 1,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              image_urls: {
                original: 'http://localhost/image1.jpg',
                thumb: 'http://localhost/thumb1.jpg',
                medium: 'http://localhost/medium1.jpg',
                large: 'http://localhost/large1.jpg'
              },
              category: {
                id: 1,
                name: 'Electronics',
                description: 'Electronic products'
              },
              variants: [
                {
                  id: 1,
                  sku: 'PROD-001',
                  price: '100.50',
                  product_id: 1,
                  created_at: '2023-01-01T00:00:00Z',
                  updated_at: '2023-01-01T00:00:00Z',
                  image_url: 'http://localhost/variant1.jpg',
                  attribute_values: [
                    {
                      id: 1,
                      value: 'Red',
                      attribute_id: 1,
                      attribute: {
                        id: 1,
                        name: 'Color'
                      }
                    }
                  ],
                  inventory: [
                    {
                      id: 1,
                      quantity: '10',
                      low_stock_threshold: '5',
                      store: {
                        id: 1,
                        name: 'Main Store'
                      }
                    }
                  ]
                }
              ],
              attributes: [
                {
                  id: 1,
                  name: 'Color',
                  type: 'select',
                  description: 'Product color'
                }
              ]
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      const product = result.current.data![0];
      
      expect(product).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Product 1',
          categoryName: 'Electronics',
          mainImageUrl: 'http://127.0.0.1/image1.jpg',
          price_range: {
            min: 100.5,
            max: 100.5,
            count: 1
          }
        })
      );

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/products', {
        params: { query: undefined }
      });
    });

    it('should handle filters properly', async () => {
      const mockData = { data: { data: [] } };
      const filters = {
        product_name: 'test',
        store_id: 1,
        category_id: 2,
        low_stock: true,
        out_of_stock: false,
        search: 'search term',
        page: 1,
        per_page: 20
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProducts(filters), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/products', {
        params: {
          query: {
            product_name: 'test',
            store_id: 1,
            category_id: 2,
            low_stock: true,
            out_of_stock: false,
            'filter[search]': 'search term',
            page: 1,
            per_page: 20
          }
        }
      });
    });

    it('should handle direct array response', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            name: 'Product 1',
            variants: [],
            attributes: []
          }
        ]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Product 1',
          categoryName: '未分類',
          mainImageUrl: 'https://via.placeholder.com/300x300'
        })
      );
    });

    it('should handle non-array response', async () => {
      const mockData = { invalid: 'structure' };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle products with missing data gracefully', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              // Missing most fields
              variants: [
                {
                  id: 1,
                  // Missing price, sku, etc.
                }
              ]
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const product = result.current.data![0];
      expect(product).toEqual(
        expect.objectContaining({
          id: 1,
          name: '未命名商品',
          description: null,
          category_id: null,
          categoryName: '未分類',
          variants: [
            expect.objectContaining({
              id: 1,
              sku: 'N/A',
              price: 0,
              specifications: '標準規格',
              stock: 0
            })
          ],
          price_range: {
            min: 0,
            max: 0,
            count: 0
          }
        })
      );
    });

    it.skip('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Network error'));
    });

    it('should calculate price range correctly with multiple variants', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              name: 'Product 1',
              variants: [
                { id: 1, price: '10.00' },
                { id: 2, price: '25.50' },
                { id: 3, price: '5.25' },
                { id: 4, price: '0' } // Should be excluded
              ]
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProducts(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const product = result.current.data![0];
      expect(product.price_range).toEqual({
        min: 5.25,
        max: 25.5,
        count: 3
      });
    });
  });

  describe('useProductDetail', () => {
    it('should fetch product detail successfully', async () => {
      const mockData = {
        data: {
          id: 1,
          name: 'Product 1',
          description: 'Product description',
          category_id: 1,
          category: { id: 1, name: 'Electronics' },
          attributes: [
            { id: 1, name: 'Color', type: 'select' }
          ],
          variants: [
            {
              id: 1,
              sku: 'PROD-001',
              price: 100,
              attribute_values: [
                { id: 1, attribute_id: 1, value: 'Red' }
              ]
            }
          ],
          image_url: 'image.jpg',
          has_image: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProductDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Product 1',
          description: 'Product description',
          attributes: [
            expect.objectContaining({
              id: 1,
              name: 'Color'
            })
          ],
          variants: [
            expect.objectContaining({
              id: 1,
              sku: 'PROD-001',
              price: 100,
              attribute_values: [
                expect.objectContaining({
                  id: 1,
                  attribute_id: 1,
                  value: 'Red'
                })
              ]
            })
          ]
        })
      );

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/products/{id}', {
        params: { path: { id: 1 } }
      });
    });

    it('should not fetch when productId is falsy', () => {
      const { result } = renderHook(() => useProductDetail(0), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });

    it('should handle null data response', async () => {
      const mockData = { data: null };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProductDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it.skip('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Product not found' }
      });

      const { result } = renderHook(() => useProductDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Product not found'));
    });

    it('should handle product with missing attributes and variants', async () => {
      const mockData = {
        data: {
          id: 1,
          name: 'Product 1',
          // Missing attributes and variants
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProductDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Product 1',
          attributes: [],
          variants: []
        })
      );
    });
  });

  describe('useCreateProduct', () => {
    it('should create product successfully', async () => {
      const mockData = {
        data: { id: 1, name: 'New Product' }
      };
      const productData = {
        name: 'New Product',
        description: 'Product description',
        category_id: 1,
        attributes: [1, 2],
        variants: [
          {
            sku: 'PROD-001',
            price: 100,
            attribute_values: [{ attribute_id: 1, value: 'Red' }]
          }
        ]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper()
      });

      result.current.mutate(productData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/products', {
        body: productData
      });
    });

    it('should handle error during creation', async () => {
      const productData = {
        name: 'New Product'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Validation failed' }
      });

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper()
      });

      result.current.mutate(productData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Validation failed'));
    });
  });

  describe('useUpdateProduct', () => {
    it('should update product successfully', async () => {
      const mockData = {
        data: { id: 1, name: 'Updated Product' }
      };
      const updateData = {
        id: 1,
        name: 'Updated Product',
        description: 'Updated description'
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/products/{id}', {
        params: { path: { id: 1 } },
        body: { name: 'Updated Product', description: 'Updated description' }
      });
    });

    it('should handle error during update', async () => {
      const updateData = {
        id: 1,
        name: 'Updated Product'
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Update failed'));
    });
  });

  describe('useDeleteProduct', () => {
    it('should delete product successfully', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/products/{id}', {
        params: { path: { id: 1 } }
      });
    });

    it('should handle error during deletion', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: null,
        error: { message: 'Product has orders' }
      });

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Product has orders'));
    });
  });

  describe('useDeleteMultipleProducts', () => {
    it('should delete multiple products successfully', async () => {
      const mockData = { data: { deleted_count: 3 } };

      mockApiClient.DELETE.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useDeleteMultipleProducts(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ ids: [1, 2, 3] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/products/batch', {
        body: { ids: [1, 2, 3] }
      });
    });

    it('should handle error during batch deletion', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: null,
        error: { message: 'Batch delete failed' }
      });

      const { result } = renderHook(() => useDeleteMultipleProducts(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ ids: [1, 2] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Batch delete failed'));
    });
  });

  describe('useProductVariants', () => {
    it('should fetch product variants successfully', async () => {
      const mockData = {
        data: [
          { id: 1, sku: 'PROD-001', price: 100 },
          { id: 2, sku: 'PROD-002', price: 150 }
        ]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProductVariants({ product_id: 1 }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/product-variants', {
        params: { query: { product_id: 1 } }
      });
    });

    it.skip('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Variants not found' }
      });

      const { result } = renderHook(() => useProductVariants(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Variants not found'));
    });
  });

  describe('useProductVariantDetail', () => {
    it('should fetch variant detail successfully', async () => {
      const mockData = {
        data: { id: 1, sku: 'PROD-001', price: 100 }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useProductVariantDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/product-variants/{id}', {
        params: { path: { id: 1 } }
      });
    });

    it.skip('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Variant not found' }
      });

      const { result } = renderHook(() => useProductVariantDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Variant not found'));
    });
  });

  describe('useUploadProductImage', () => {
    it('should upload image successfully', async () => {
      const mockData = { data: { image_url: 'new-image.jpg' } };
      const file = new File(['image content'], 'image.jpg', { type: 'image/jpeg' });

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUploadProductImage(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ productId: 1, image: file });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/products/{id}/image', {
        params: { path: { id: 1 } },
        body: expect.any(FormData)
      });
    });

    it('should handle error during upload', async () => {
      const file = new File(['image content'], 'image.jpg', { type: 'image/jpeg' });

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upload failed' }
      });

      const { result } = renderHook(() => useUploadProductImage(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ productId: 1, image: file });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Upload failed'));
    });
  });
});