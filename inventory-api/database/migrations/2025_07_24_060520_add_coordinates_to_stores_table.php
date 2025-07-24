<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // 檢查欄位是否已存在
            if (!Schema::hasColumn('stores', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('postal_code')->comment('緯度');
            }
            if (!Schema::hasColumn('stores', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude')->comment('經度');
            }
            
            // 檢查索引是否已存在
            $existingIndexes = collect(Schema::getIndexes('stores'))
                ->pluck('name')
                ->toArray();
            
            if (!in_array('stores_coordinates_index', $existingIndexes)) {
                $table->index(['latitude', 'longitude'], 'stores_coordinates_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            // 移除索引
            $table->dropIndex('stores_coordinates_index');
            
            // 移除經緯度欄位
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
