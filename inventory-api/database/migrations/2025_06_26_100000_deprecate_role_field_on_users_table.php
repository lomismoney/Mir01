<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * 標記 users.role 字段為廢棄
     * 現在使用 Spatie Permission 的多角色系統
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 將 role 字段改為可為空，因為新用戶將不再使用此字段
            $table->string('role')->nullable()->change();
        });
        
        // 添加註釋說明此字段已廢棄（僅在 MySQL 中執行）
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(255) COMMENT 'DEPRECATED: 使用 model_has_roles 表代替'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 恢復為不可為空
            $table->string('role')->default('viewer')->change();
        });
        
        // 移除註釋（僅在 MySQL 中執行）
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(255)");
        }
    }
}; 