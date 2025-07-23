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
            $table->string('code', 20)->unique()->after('name');
            $table->string('phone', 20)->nullable()->after('address');
            $table->json('business_hours')->nullable()->after('phone');
            $table->decimal('latitude', 10, 7)->nullable()->after('business_hours');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->boolean('is_active')->default(true)->after('longitude');
            $table->boolean('is_default')->default(false)->after('is_active');
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
