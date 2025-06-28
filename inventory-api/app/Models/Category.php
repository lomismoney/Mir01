<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Laravel\Eloquent\Filter\SearchFilter;
use ApiPlatform\Laravel\Eloquent\Filter\OrderFilter;
use ApiPlatform\Metadata\QueryParameter;
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
#[ApiResource(
    shortName: 'Category',
    description: '商品分類管理',
    operations: [
        new GetCollection(
            order: ['sort_order' => 'ASC'],
            // security: "is_granted('viewAny', 'App\\Models\\Category')"
        ),
        new Get(
            // security: "is_granted('view', object)"
        ),
        new Post(
            // security: "is_granted('create', 'App\\Models\\Category')"
        ),
        new Put(
            // security: "is_granted('update', object)"
        ),
        new Delete(
            // security: "is_granted('delete', object)"
        ),
        // 批量重排序操作
        new Post(
            uriTemplate: '/categories/batch-reorder',
            controller: 'App\\Http\\Controllers\\Api\\BatchReorderCategoryController',
            deserialize: false,
            read: false,
            name: 'batch_reorder',
            // security: "is_granted('update', 'App\\Models\\Category')"
        )
    ],
    paginationItemsPerPage: 20,
    paginationClientEnabled: true,
    paginationClientItemsPerPage: true
)]
#[QueryParameter(
    key: 'search',
    filter: SearchFilter::class,
    property: 'name'
)]
#[QueryParameter(
    key: 'parent_id',
    filter: SearchFilter::class,
    property: 'parent_id'
)]
#[QueryParameter(
    key: 'order[name]',
    filter: OrderFilter::class
)]
#[QueryParameter(
    key: 'order[sort_order]', 
    filter: OrderFilter::class
)]
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
     * 屬性轉型
     */
    protected $casts = [
        'sort_order' => 'integer',
        'parent_id' => 'integer',
    ];

    /**
     * 默認排序
     */
    protected static function boot()
    {
        parent::boot();
        
        // 新建分類時自動設置排序值
        static::creating(function ($category) {
            if (is_null($category->sort_order)) {
                $maxOrder = static::where('parent_id', $category->parent_id)
                    ->max('sort_order');
                $category->sort_order = $maxOrder ? $maxOrder + 1 : 1;
            }
        });
    }

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
        return $this->hasMany(Category::class, 'parent_id')
            ->orderBy('sort_order');
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

    /**
     * 檢查是否有子分類
     */
    public function hasChildren(): bool
    {
        return $this->children()->exists();
    }

    /**
     * 檢查是否有商品
     */
    public function hasProducts(): bool
    {
        return $this->products()->exists();
    }
}
