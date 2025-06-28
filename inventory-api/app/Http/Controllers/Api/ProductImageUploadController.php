<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileDoesNotExist;
use Exception;

/**
 * ProductImageUploadController - 商品圖片上傳控制器
 * 
 * 負責處理商品圖片的上傳與管理：
 * 1. 驗證上傳的圖片文件
 * 2. 處理圖片存儲與轉換
 * 3. 更新商品的媒體關聯
 * 4. 返回圖片 URL 和相關資訊
 * 
 * 整合 Spatie MediaLibrary 進行媒體管理
 */
class ProductImageUploadController extends Controller
{
    /**
     * 上傳商品圖片
     * 
     * @param Request $request HTTP 請求
     * @param int $id 商品ID
     * @return JsonResponse JSON 響應
     */
    public function __invoke(Request $request, int $id): JsonResponse
    {
        try {
            // 1. 驗證商品存在
            $product = Product::find($id);
            if (!$product) {
                return response()->json([
                    'error' => '商品不存在',
                    'product_id' => $id
                ], 404);
            }

            // 2. 驗證請求數據
            $validator = $this->validateRequest($request);
            if ($validator->fails()) {
                return response()->json([
                    'error' => '圖片上傳驗證失敗',
                    'details' => $validator->errors()
                ], 422);
            }

            // 3. 處理圖片上傳
            $result = $this->handleImageUpload($product, $request);

            // 4. 記錄操作日誌
            Log::info('Product image uploaded successfully', [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'image_url' => $result['image_url'],
                'file_size' => $result['file_size'],
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => '圖片上傳成功',
                'product_id' => $product->id,
                'image_url' => $result['image_url'],
                'image_urls' => $result['image_urls'],
                'file_info' => $result['file_info']
            ], 200);

        } catch (FileDoesNotExist $e) {
            Log::error('File does not exist during upload', [
                'product_id' => $id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'error' => '文件上傳失敗',
                'message' => '指定的文件不存在'
            ], 400);

        } catch (Exception $e) {
            Log::error('Product image upload failed', [
                'product_id' => $id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => '圖片上傳失敗',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 驗證請求數據
     * 
     * @param Request $request HTTP 請求
     * @return \Illuminate\Contracts\Validation\Validator 驗證器
     */
    private function validateRequest(Request $request): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($request->all(), [
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,jpg,png,gif,webp',
                'max:10240', // 10MB 最大文件大小
                'dimensions:min_width=100,min_height=100,max_width=4000,max_height=4000'
            ]
        ], [
            'image.required' => '請選擇要上傳的圖片',
            'image.file' => '上傳的必須是文件',
            'image.image' => '上傳的文件必須是圖片格式',
            'image.mimes' => '支援的圖片格式：JPEG、JPG、PNG、GIF、WebP',
            'image.max' => '圖片大小不能超過 10MB',
            'image.dimensions' => '圖片尺寸要求：最小 100x100 像素，最大 4000x4000 像素'
        ]);
    }

    /**
     * 處理圖片上傳
     * 
     * @param Product $product 商品實例
     * @param Request $request HTTP 請求
     * @return array 上傳結果
     */
    private function handleImageUpload(Product $product, Request $request): array
    {
        $uploadedFile = $request->file('image');
        
        // 檢查是否已有圖片，如果有則先刪除
        if ($product->hasMedia('images')) {
            $product->clearMediaCollection('images');
            Log::info('Previous product image cleared', [
                'product_id' => $product->id
            ]);
        }

        // 生成有意義的文件名
        $filename = $this->generateFilename($product, $uploadedFile);

        // 上傳並添加到媒體庫
        $mediaItem = $product->addMediaFromRequest('image')
            ->usingName($product->name . ' 商品圖片')
            ->usingFileName($filename)
            ->toMediaCollection('images');

        // 獲取圖片 URL
        $imageUrl = $mediaItem->getUrl();
        $imageUrls = $product->getImageUrls();

        // 文件資訊
        $fileInfo = [
            'id' => $mediaItem->id,
            'name' => $mediaItem->name,
            'file_name' => $mediaItem->file_name,
            'size' => $mediaItem->size,
            'human_readable_size' => $this->formatFileSize($mediaItem->size),
            'mime_type' => $mediaItem->mime_type,
            'uploaded_at' => $mediaItem->created_at->toDateTimeString()
        ];

        return [
            'image_url' => $imageUrl,
            'image_urls' => $imageUrls,
            'file_info' => $fileInfo,
            'file_size' => $mediaItem->size
        ];
    }

    /**
     * 生成有意義的文件名
     * 
     * @param Product $product 商品實例
     * @param \Illuminate\Http\UploadedFile $file 上傳的文件
     * @return string 生成的文件名
     */
    private function generateFilename(Product $product, $file): string
    {
        // 清理商品名稱，移除特殊字符
        $cleanName = preg_replace('/[^a-zA-Z0-9\u4e00-\u9fa5]/', '_', $product->name);
        $cleanName = mb_substr($cleanName, 0, 50); // 限制長度
        
        // 獲取文件擴展名
        $extension = $file->getClientOriginalExtension();
        
        // 添加時間戳確保唯一性
        $timestamp = now()->format('YmdHis');
        
        return "{$cleanName}_{$product->id}_{$timestamp}.{$extension}";
    }

    /**
     * 格式化文件大小為人類可讀格式
     * 
     * @param int $bytes 字節數
     * @return string 格式化的大小
     */
    private function formatFileSize(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } elseif ($bytes > 1) {
            return $bytes . ' bytes';
        } elseif ($bytes == 1) {
            return $bytes . ' byte';
        } else {
            return '0 bytes';
        }
    }
} 