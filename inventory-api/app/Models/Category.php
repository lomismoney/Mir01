<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Category 模型
 * 
 * 支援階層式分類結構，提供父子分類關係管理
 * 可與商品建立一對多關係
 */
class Category extends Model
{
    use HasFactory;

    /**
     * 可大量賦值的屬性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'parent_id',
        'sort_order',
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'parent_id' => 'integer',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取此分類的父分類
     * 
     * @return BelongsTo<Category, Category>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * 獲取此分類的所有子分類
     * 
     * @return HasMany<Category>
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * 獲取此分類的所有後代（子孫）分類
     * 
     * @return HasMany<Category>
     */
    public function descendants(): HasMany
    {
        return $this->children()->with('descendants');
    }

    /**
     * 獲取此分類下的所有商品
     * 
     * @return HasMany<Product>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
