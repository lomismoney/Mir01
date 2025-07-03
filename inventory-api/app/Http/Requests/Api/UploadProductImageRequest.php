<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * 商品圖片上傳請求驗證
 * 
 * 遵循 Spatie Media Library 官方安全建議：
 * - 嚴格的檔案類型驗證
 * - 檔案大小限制
 * - 圖片尺寸驗證
 * - 安全性檢查
 */
class UploadProductImageRequest extends FormRequest
{
    /**
     * 確定用戶是否有權限進行此請求
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        return true; // 授權在 Controller 中處理
    }

    /**
     * 獲取應用於請求的驗證規則
     * 
     * 根據 Context7 最佳實踐配置：
     * - 使用 image 規則確保是有效圖片
     * - 限制 MIME 類型為安全格式
     * - 設定合理的檔案大小限制（5MB）
     * - 設定最小和最大尺寸要求
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'image', // 確保是有效的圖片檔案
                'mimes:jpeg,jpg,png,gif,webp', // 限制允許的 MIME 類型
                'max:5120', // 最大 5MB (5120 KB)
                'dimensions:min_width=200,min_height=200,max_width=4000,max_height=4000', // 尺寸限制
            ],
        ];
    }

    /**
     * 獲取自定義驗證錯誤訊息
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required' => '請選擇要上傳的圖片檔案。',
            'image.file' => '上傳的檔案必須是有效的檔案。',
            'image.image' => '上傳的檔案必須是有效的圖片格式。',
            'image.mimes' => '圖片格式必須是：JPEG、JPG、PNG、GIF 或 WebP。',
            'image.max' => '圖片檔案大小不能超過 5MB。',
            'image.dimensions' => '圖片尺寸必須在 200x200 到 4000x4000 像素之間。',
        ];
    }

    /**
     * 獲取自定義屬性名稱
     * 
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'image' => '圖片檔案',
        ];
    }

    /**
     * 配置驗證器實例
     * 
     * 添加額外的安全檢查：
     * - 使用 getimagesize() 進行二次驗證
     * - 檢查檔案是否為真正的圖片
     * 
     * @param Validator $validator
     * @return void
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->hasFile('image') && $this->file('image')->isValid()) {
                $file = $this->file('image');
                
                // 使用 getimagesize() 進行額外的安全檢查
                $imageInfo = @getimagesize($file->getPathname());
                
                if ($imageInfo === false) {
                    $validator->errors()->add('image', '上傳的檔案不是有效的圖片格式。');
                    return;
                }
                
                // 檢查圖片類型是否在允許的範圍內
                $allowedTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP];
                if (!in_array($imageInfo[2], $allowedTypes)) {
                    $validator->errors()->add('image', '不支援的圖片類型。');
                    return;
                }
                
                // 檢查檔案內容是否與副檔名匹配
                $detectedMime = $imageInfo['mime'];
                $uploadedMime = $file->getMimeType();
                
                // 允許的 MIME 類型對應
                $allowedMimes = [
                    'image/jpeg',
                    'image/jpg', 
                    'image/png',
                    'image/gif',
                    'image/webp'
                ];
                
                if (!in_array($detectedMime, $allowedMimes) || 
                    !in_array($uploadedMime, $allowedMimes)) {
                    $validator->errors()->add('image', '檔案內容與格式不符，可能是偽造的圖片檔案。');
                    return;
                }
                
                // 檢查檔案大小是否合理（防止壓縮炸彈）
                $width = $imageInfo[0];
                $height = $imageInfo[1];
                $fileSize = $file->getSize();
                
                // 計算每像素的平均位元組數（粗略估算）
                $pixelCount = $width * $height;
                $bytesPerPixel = $fileSize / $pixelCount;
                
                // 如果每像素超過 50 位元組，可能是異常檔案
                if ($bytesPerPixel > 50) {
                    $validator->errors()->add('image', '圖片檔案可能存在異常，請嘗試其他圖片。');
                }
            }
        });
    }

    /**
     * 處理驗證失敗
     * 
     * 返回結構化的 JSON 錯誤回應
     * 
     * @param Validator $validator
     * @throws HttpResponseException
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => '圖片上傳驗證失敗',
                'errors' => $validator->errors(),
            ], 422)
        );
    }

    /**
     * 準備驗證的資料
     * 
     * 在驗證之前清理和準備資料
     * 
     * @return void
     */
    protected function prepareForValidation(): void
    {
        // 確保檔案存在且有效
        if ($this->hasFile('image')) {
            $file = $this->file('image');
            
            // 記錄上傳檔案的基本資訊（用於調試）
            \Log::info('圖片上傳驗證開始', [
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'extension' => $file->getClientOriginalExtension(),
            ]);
        }
    }
    
    /**
     * 取得請求體參數的文檔
     * 
     * 用於 Scribe API 文檔生成
     * 
     * @return array
     */
    public function bodyParameters(): array
    {
        return [
            'image' => [
                'description' => '要上傳的圖片檔案（支援 JPEG、JPG、PNG、GIF、WebP 格式，最大 5MB）',
                'example' => 'no-example',
            ],
        ];
    }
} 