<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * 執行資料庫遷移
     */
    public function up(): void
    {
        // 步驟 A: 找出所有重複的手機號碼
        $duplicates = DB::table('customers')
                        ->select('phone')
                        ->whereNotNull('phone')
                        ->groupBy('phone')
                        ->havingRaw('COUNT(*) > 1')
                        ->pluck('phone');

        // 步驟 B: 將這些重複號碼的記錄清空 (只保留第一個)
        foreach ($duplicates as $phone) {
            $idsToNull = DB::table('customers')
                            ->where('phone', $phone)
                            ->orderBy('id', 'asc')
                            ->skip(1)
                            ->pluck('id');
            
            if ($idsToNull->isNotEmpty()) {
                DB::table('customers')->whereIn('id', $idsToNull)->update(['phone' => null]);
            }
        }

        // 步驟 C: 為 phone 欄位添加唯一索引
        Schema::table('customers', function (Blueprint $table) {
            // 直接修改欄位並加上唯一索引
            // change() 方法會處理現有的索引
            $table->string('phone')->nullable()->unique()->change();
        });
    }

    /**
     * 回滾資料庫遷移
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // 移除唯一索引
            $table->dropUnique(['phone']);
            // 重新加上普通索引
            $table->index('phone');
        });
    }
};
