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
        Schema::table('purchases', function (Blueprint $table) {
            $table->boolean('is_tax_inclusive')->default(false)->after('total_amount')->comment('是否為含稅價');
            $table->unsignedTinyInteger('tax_rate')->default(0)->after('is_tax_inclusive')->comment('稅率（百分比）');
            $table->bigInteger('tax_amount')->default(0)->after('tax_rate')->comment('稅額（以分為單位）');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn(['is_tax_inclusive', 'tax_rate', 'tax_amount']);
        });
    }
};
