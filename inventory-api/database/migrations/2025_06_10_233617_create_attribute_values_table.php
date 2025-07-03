<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 建立 attribute_values 資料表，用於存儲屬性的具體值（如紅色、藍色、S、M、L等）
     */
    public function up(): void
    {
        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')
                  ->constrained()
                  ->onDelete('cascade')
                  ->comment('關聯的屬性ID，外鍵約束到 attributes 表');
            $table->string('value')->comment('屬性值，例如：紅色、S'); // 例如："紅色", "S"
            $table->timestamps();
            
            // 同一個屬性下的值不能重複
            $table->unique(['attribute_id', 'value'], 'unique_attribute_value');
        });
    }

    /**
     * 回滾遷移
     * 刪除 attribute_values 資料表
     */
    public function down(): void
    {
        Schema::dropIfExists('attribute_values');
    }
};
