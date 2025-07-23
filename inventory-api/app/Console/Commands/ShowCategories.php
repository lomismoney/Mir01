<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Category;

class ShowCategories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'categories:show';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '顯示分類層級結構';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('分類層級結構：');
        $this->info('================');
        
        // 取得所有頂層分類
        $topCategories = Category::whereNull('parent_id')->orderBy('sort_order')->get();
        
        foreach ($topCategories as $category) {
            $this->showCategory($category, 0);
        }
        
        $this->newLine();
        $this->info('總計：' . Category::count() . ' 個分類');
    }
    
    /**
     * 遞迴顯示分類及其子分類
     */
    private function showCategory($category, $level)
    {
        $indent = str_repeat('  ', $level);
        $prefix = $level > 0 ? '├─ ' : '';
        
        $this->line($indent . $prefix . $category->name . ' (' . $category->description . ')');
        
        // 顯示子分類
        $children = $category->children()->orderBy('sort_order')->get();
        foreach ($children as $child) {
            $this->showCategory($child, $level + 1);
        }
    }
}