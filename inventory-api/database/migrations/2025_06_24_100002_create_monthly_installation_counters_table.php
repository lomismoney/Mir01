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
        Schema::create('monthly_installation_counters', function (Blueprint $table) {
            $table->id();
            $table->string('year_month', 7)->unique(); // 格式: YYYY-MM
            $table->integer('last_sequence')->default(0); // 最後使用的序號
            $table->timestamps();
            
            // 索引
            $table->index('year_month');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_installation_counters');
    }
}; 