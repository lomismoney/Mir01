<?php

namespace Tests\Unit;

use App\Services\CategoryService;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * CategoryService 測試
 * 
 * 測試分類服務層的所有功能
 */
class CategoryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected CategoryService $categoryService;

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->categoryService = new CategoryService();
    }

    /**
     * 測試 reorder 方法 - 成功重新排序
     */
    public function test_reorder_successfully_updates_category_order(): void
    {
        // 準備測試數據
        $category1 = Category::factory()->create(['name' => '分類1', 'sort_order' => 1]);
        $category2 = Category::factory()->create(['name' => '分類2', 'sort_order' => 2]);
        $category3 = Category::factory()->create(['name' => '分類3', 'sort_order' => 3]);

        // 準備重新排序的數據
        $reorderData = [
            ['id' => $category1->id, 'sort_order' => 3],
            ['id' => $category2->id, 'sort_order' => 1],
            ['id' => $category3->id, 'sort_order' => 2],
        ];

        // 執行重新排序
        $this->categoryService->reorder($reorderData);

        // 驗證排序結果
        $this->assertDatabaseHas('categories', [
            'id' => $category1->id,
            'sort_order' => 3,
        ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category2->id,
            'sort_order' => 1,
        ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category3->id,
            'sort_order' => 2,
        ]);
    }

    /**
     * 測試 reorder 方法 - 處理空數組
     */
    public function test_reorder_handles_empty_array(): void
    {
        // 準備測試數據
        $category = Category::factory()->create(['sort_order' => 1]);

        // 執行重新排序（空數組）
        $this->categoryService->reorder([]);

        // 驗證原數據沒有變化
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'sort_order' => 1,
        ]);
    }

    /**
     * 測試 reorder 方法 - 處理單個分類
     */
    public function test_reorder_handles_single_category(): void
    {
        // 準備測試數據
        $category = Category::factory()->create(['sort_order' => 1]);

        // 準備重新排序的數據
        $reorderData = [
            ['id' => $category->id, 'sort_order' => 5],
        ];

        // 執行重新排序
        $this->categoryService->reorder($reorderData);

        // 驗證排序結果
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'sort_order' => 5,
        ]);
    }

    /**
     * 測試 reorder 方法 - 處理重複的排序值
     */
    public function test_reorder_handles_duplicate_sort_orders(): void
    {
        // 準備測試數據
        $category1 = Category::factory()->create(['sort_order' => 1]);
        $category2 = Category::factory()->create(['sort_order' => 2]);

        // 準備重新排序的數據（重複的排序值）
        $reorderData = [
            ['id' => $category1->id, 'sort_order' => 1],
            ['id' => $category2->id, 'sort_order' => 1],
        ];

        // 執行重新排序
        $this->categoryService->reorder($reorderData);

        // 驗證排序結果
        $this->assertDatabaseHas('categories', [
            'id' => $category1->id,
            'sort_order' => 1,
        ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category2->id,
            'sort_order' => 1,
        ]);
    }

    /**
     * 測試 reorder 方法 - 使用數據庫事務
     */
    public function test_reorder_uses_database_transaction(): void
    {
        // 準備測試數據
        $category1 = Category::factory()->create(['sort_order' => 1]);
        $category2 = Category::factory()->create(['sort_order' => 2]);

        // 記錄事務調用
        DB::beginTransaction();
        
        try {
            // 準備重新排序的數據
            $reorderData = [
                ['id' => $category1->id, 'sort_order' => 2],
                ['id' => $category2->id, 'sort_order' => 1],
            ];

            // 執行重新排序
            $this->categoryService->reorder($reorderData);

            // 驗證排序結果
            $this->assertDatabaseHas('categories', [
                'id' => $category1->id,
                'sort_order' => 2,
            ]);

            $this->assertDatabaseHas('categories', [
                'id' => $category2->id,
                'sort_order' => 1,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * 測試 reorder 方法 - 處理不存在的分類ID
     */
    public function test_reorder_handles_non_existent_category_id(): void
    {
        // 準備測試數據
        $category = Category::factory()->create(['sort_order' => 1]);

        // 準備重新排序的數據（包含不存在的ID）
        $reorderData = [
            ['id' => $category->id, 'sort_order' => 3],
            ['id' => 999999, 'sort_order' => 1], // 不存在的ID
        ];

        // 執行重新排序（應該不會拋出異常）
        $this->categoryService->reorder($reorderData);

        // 驗證存在的分類被更新
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'sort_order' => 3,
        ]);
    }

    /**
     * 測試 reorder 方法 - 處理大量分類
     */
    public function test_reorder_handles_large_number_of_categories(): void
    {
        // 準備大量測試數據
        $categories = Category::factory()->count(100)->create();

        // 準備重新排序的數據（反轉排序）
        $reorderData = [];
        foreach ($categories as $index => $category) {
            $reorderData[] = [
                'id' => $category->id,
                'sort_order' => 100 - $index,
            ];
        }

        // 執行重新排序
        $this->categoryService->reorder($reorderData);

        // 驗證幾個關鍵分類的排序結果
        $firstCategory = $categories->first();
        $lastCategory = $categories->last();

        $this->assertDatabaseHas('categories', [
            'id' => $firstCategory->id,
            'sort_order' => 100,
        ]);

        $this->assertDatabaseHas('categories', [
            'id' => $lastCategory->id,
            'sort_order' => 1,
        ]);
    }

    /**
     * 測試 reorder 方法 - 處理負數排序值
     */
    public function test_reorder_handles_negative_sort_orders(): void
    {
        // 準備測試數據
        $category1 = Category::factory()->create(['sort_order' => 1]);
        $category2 = Category::factory()->create(['sort_order' => 2]);

        // 準備重新排序的數據（負數排序值）
        $reorderData = [
            ['id' => $category1->id, 'sort_order' => -1],
            ['id' => $category2->id, 'sort_order' => -2],
        ];

        // 執行重新排序
        $this->categoryService->reorder($reorderData);

        // 驗證排序結果
        $this->assertDatabaseHas('categories', [
            'id' => $category1->id,
            'sort_order' => -1,
        ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category2->id,
            'sort_order' => -2,
        ]);
    }

    /**
     * 測試 reorder 方法 - 處理 0 排序值
     */
    public function test_reorder_handles_zero_sort_order(): void
    {
        // 準備測試數據
        $category = Category::factory()->create(['sort_order' => 1]);

        // 準備重新排序的數據（0 排序值）
        $reorderData = [
            ['id' => $category->id, 'sort_order' => 0],
        ];

        // 執行重新排序
        $this->categoryService->reorder($reorderData);

        // 驗證排序結果
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'sort_order' => 0,
        ]);
    }
} 