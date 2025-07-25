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
            if (!Schema::hasColumn('stores', 'code')) {
                $table->string('code', 20)->unique()->after('name');
            }
            if (!Schema::hasColumn('stores', 'phone')) {
                $table->string('phone', 20)->nullable()->after('address');
            }
            if (!Schema::hasColumn('stores', 'business_hours')) {
                $table->json('business_hours')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('stores', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('business_hours');
            }
            if (!Schema::hasColumn('stores', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
            if (!Schema::hasColumn('stores', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('longitude');
            }
            if (!Schema::hasColumn('stores', 'is_default')) {
                $table->boolean('is_default')->default(false)->after('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn([
                'code',
                'phone',
                'business_hours',
                'latitude',
                'longitude',
                'is_active',
                'is_default'
            ]);
        });
    }
};
