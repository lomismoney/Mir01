<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Image\Enums\Fit;

/**
 * Product 模型 - SPU (Standard Product Unit)
 * 
 * 用於管理標準化商品單元，例如：「經典棉質T-shirt」、「Aeron 人體工學椅」
 * 一個 SPU 可以有多個 SKU 變體
 * 與 Category 是多對一關係
 * 與 ProductVariant（SKU）是一對多關係
 * 與 Attribute 通過樞紐表建立多對多關係
 * 支援媒體庫功能，可儲存商品圖片
 */
class Product extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    /**
     * 允許大量賦值的屬性設定
     * 保護 id 和時間戳不被意外修改
     */
    protected $fillable = [
        'name',        // SPU 名稱，例如：經典棉質T-shirt
        'description', // 商品描述
        'category_id', // 所屬分類 ID
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'category_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取該 SPU 所屬的分類
     * 
     * @return BelongsTo<Category, Product>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * 獲取該 SPU 的所有 SKU 變體
     * 一個 SPU 可以有多個不同的 SKU（如不同顏色、尺寸的組合）
     * 
     * @return HasMany<ProductVariant>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * 獲取該 SPU 支援的所有屬性類型
     * 通過 product_attribute 樞紐表建立多對多關係
     * 例如：T-shirt SPU 支援「顏色」和「尺寸」屬性
     * 
     * @return BelongsToMany<Attribute>
     */
    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(Attribute::class, 'product_attribute');
    }

    /**
     * 獲取該 SPU 的所有庫存記錄（透過 SKU 變體）
     * 注意：在新架構中，庫存直接關聯到 SKU，而非 SPU
     * 此方法提供便利的聚合查詢
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough<Inventory>
     */
    public function inventories(): HasManyThrough
    {
        return $this->hasManyThrough(Inventory::class, ProductVariant::class);
    }

    /**
     * 作用域：根據分類篩選商品
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $categoryId 分類 ID
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * 作用域：搜尋商品名稱
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $name 搜尋關鍵字
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSearchName($query, string $name)
    {
        return $query->where('name', 'like', "%{$name}%");
    }

    /**
     * 獲取該 SPU 的總庫存數量
     * 計算所有 SKU 變體的庫存總和
     * 
     * @return int
     */
    public function getTotalStockAttribute(): int
    {
        return $this->inventories()->sum('quantity');
    }

    /**
     * 獲取該 SPU 的 SKU 變體數量
     * 
     * @return int
     */
    public function getVariantCountAttribute(): int
    {
        return $this->variants()->count();
    }

    /**
     * 獲取該 SPU 的價格範圍
     * 返回最低價和最高價
     * 
     * @return array
     */
    public function getPriceRangeAttribute(): array
    {
        $variants = $this->variants;
        
        if ($variants->isEmpty()) {
            return ['min' => null, 'max' => null];
        }
        
        // 使用原始數據庫值（分）進行計算，避免 accessor 轉換
        $prices = $variants->map(function ($variant) {
            return $variant->getRawOriginal('price');
        })->filter();
        
        return [
            'min' => $prices->min(),
            'max' => $prices->max(),
        ];
    }

    /**
     * 註冊媒體集合
     * 
     * 定義商品圖片的存儲集合和驗證規則
     * 暫時禁用轉換以解決 Windows 路徑問題
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->acceptsMimeTypes(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
            ->singleFile(); // 每個商品只允許一張主圖
    }

    /**
     * 註冊媒體轉換
     * 
     * 暫時註釋掉以避免 Windows 路徑問題
     * 後續將重新啟用
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        // 暫時禁用轉換以解決路徑問題
        // 將在路徑問題解決後重新啟用
        
        /*
        $this->addMediaConversion('thumb')
            ->fit(Fit::Contain, 300, 300)
            ->quality(85)
            ->format('jpg')
            ->nonQueued(); // Windows 環境建議不使用隊列

        $this->addMediaConversion('medium')
            ->fit(Fit::Contain, 600, 600)
            ->quality(85)
            ->format('jpg')
            ->nonQueued();

        $this->addMediaConversion('large')
            ->fit(Fit::Contain, 1200, 1200)
            ->quality(90)
            ->format('jpg')
            ->nonQueued();
        */
    }

    /**
     * 檢查商品是否有圖片
     * 
     * @return bool
     */
    public function hasImage(): bool
    {
        return $this->hasMedia('images');
    }

    /**
     * 獲取商品圖片 URL
     * 
     * 簡化版本，只返回原始圖片
     * 
     * @return string|null
     */
    public function getImageUrl(): ?string
    {
        $media = $this->getFirstMedia('images');
        return $media ? $media->getUrl() : null;
    }

    /**
     * 獲取所有尺寸的圖片 URL
     * 
     * 暫時只返回原始圖片，轉換功能將稍後重新啟用
     * 
     * @return array<string, string|null>
     */
    public function getImageUrls(): array
    {
        $media = $this->getFirstMedia('images');
        
        if (!$media) {
            return [
                'original' => null,
                'thumb' => null,
                'medium' => null,
                'large' => null,
            ];
        }

        // 暫時只返回原始圖片
        $originalUrl = $media->getUrl();
        
        return [
            'original' => $originalUrl,
            'thumb' => $originalUrl, // 暫時使用原始圖片
            'medium' => $originalUrl, // 暫時使用原始圖片
            'large' => $originalUrl, // 暫時使用原始圖片
        ];
    }

    /**
     * 獲取圖片的所有尺寸路徑
     * 返回包含所有轉換版本的檔案路徑陣列
     * 
     * @return array<string, string> 包含各種尺寸路徑的陣列
     */
    public function getImagePaths(): array
    {
        if (!$this->hasImage()) {
            return [
                'original' => '',
                'thumb' => '',
                'medium' => '',
                'large' => '',
            ];
        }

        $media = $this->getFirstMedia('images');
        
        // 由於轉換被禁用，暫時都使用原始路徑
        $originalPath = $media->getPath();
        
        return [
            'original' => $originalPath,
            'thumb' => $originalPath,
            'medium' => $originalPath,
            'large' => $originalPath,
        ];
    }

    /**
     * 檢查指定轉換是否已生成
     * 
     * @param string $conversionName 轉換名稱
     * @return bool
     */
    public function hasConversion(string $conversionName): bool
    {
        if (!$this->hasImage()) {
            return false;
        }

        return $this->getFirstMedia('images')->hasGeneratedConversion($conversionName);
    }

    /**
     * 獲取可用的轉換 URL
     * 如果指定的轉換不存在，則回退到原圖
     * 
     * @param array<string> $conversions 優先順序的轉換名稱陣列
     * @return string
     */
    public function getAvailableImageUrl(array $conversions = ['medium', 'large', 'thumb']): string
    {
        if (!$this->hasImage()) {
            return '';
        }

        return $this->getFirstMedia('images')->getAvailableUrl($conversions);
    }
}
