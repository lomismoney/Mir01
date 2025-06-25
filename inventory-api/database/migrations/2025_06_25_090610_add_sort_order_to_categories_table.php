<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 為 categories 表添加 sort_order 欄位，用於支援拖曳排序功能
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // 添加排序欄位，默認值為 0
            $table->unsignedInteger('sort_order')->default(0)->after('parent_id');
            
            // 為排序欄位添加索引，提升查詢效能
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // 刪除索引
            $table->dropIndex(['sort_order']);
            
            // 刪除欄位
            $table->dropColumn('sort_order');
        });
    }
};
