<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 執行遷移
     * 
     * 為客戶表添加 email 欄位
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // 添加 email 欄位，可為空，且需要唯一索引
            $table->string('email', 255)
                  ->nullable()
                  ->unique()
                  ->after('phone')
                  ->comment('客戶電子郵件地址');
        });
    }

    /**
     * 回滾遷移
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // 移除 email 欄位
            $table->dropColumn('email');
        });
    }
};
