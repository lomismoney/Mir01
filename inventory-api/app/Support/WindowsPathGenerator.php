<?php

namespace App\Support;

use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

/**
 * Windows 兼容的路徑生成器
 * 
 * 解決 Windows 環境下路徑分隔符混用的問題
 * 確保所有路徑使用正確的分隔符
 */
class WindowsPathGenerator implements PathGenerator
{
    /**
     * 獲取媒體檔案的存儲路徑
     * 
     * @param Media $media
     * @return string
     */
    public function getPath(Media $media): string
    {
        return $this->normalizePath($media->id . DIRECTORY_SEPARATOR);
    }

    /**
     * 獲取轉換檔案的存儲路徑
     * 
     * @param Media $media
     * @return string
     */
    public function getPathForConversions(Media $media): string
    {
        return $this->normalizePath($media->id . DIRECTORY_SEPARATOR . 'conversions' . DIRECTORY_SEPARATOR);
    }

    /**
     * 獲取響應式圖片的存儲路徑
     * 
     * @param Media $media
     * @return string
     */
    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->normalizePath($media->id . DIRECTORY_SEPARATOR . 'responsive-images' . DIRECTORY_SEPARATOR);
    }

    /**
     * 標準化路徑分隔符
     * 
     * 對於存儲路徑，使用系統分隔符
     * 對於 URL 路徑，始終使用正斜線
     * 
     * @param string $path
     * @return string
     */
    protected function normalizePath(string $path): string
    {
        // 始終使用正斜線作為分隔符，確保 URL 正確
        $separator = '/';
        
        // 替換所有分隔符為正斜線
        $path = str_replace(['\\', DIRECTORY_SEPARATOR], $separator, $path);
        
        // 移除重複的分隔符
        $path = preg_replace('/[' . preg_quote($separator, '/') . ']+/', $separator, $path);
        
        // 確保路徑以分隔符結尾
        if (!str_ends_with($path, $separator)) {
            $path .= $separator;
        }
        
        return $path;
    }
} 