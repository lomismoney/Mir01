<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 修復 stores 表的 code 欄位，使其可以為 null
     * 解決 API Platform POST 請求時的 500 錯誤
     */
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // 將 code 欄位改為可為 null
            $table->string('code', 50)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // 回滾時將 code 欄位改回不可為 null
            $table->string('code', 50)->nullable(false)->change();
        });
    }
};
