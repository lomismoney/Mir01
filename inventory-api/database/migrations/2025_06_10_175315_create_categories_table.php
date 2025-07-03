<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移，建立 categories 資料表
     * 
     * 此資料表支援階層式分類結構：
     * - 支援多層分類嵌套
     * - 使用 parent_id 建立自參照關係
     * - 頂層分類的 parent_id 為 null
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();

            // 關鍵：允許為空，因為頂層分類沒有父級
            $table->unsignedBigInteger('parent_id')->nullable(); 
            $table->timestamps();

            // 設定外鍵，參照到 categories 表自身的 id 欄位
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('cascade'); // 當父分類被刪除時，其所有子分類也一併刪除
        });
    }

    /**
     * 回滾遷移，刪除 categories 資料表
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
