<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            DB::statement('UPDATE purchase_items SET unit_price = unit_price * 100');
            DB::statement('UPDATE purchase_items SET cost_price = cost_price * 100');
            DB::statement('UPDATE purchase_items SET allocated_shipping_cost = allocated_shipping_cost * 100');

            $table->integer('unit_price')->default(0)->change();
            $table->integer('cost_price')->default(0)->change();
            $table->integer('allocated_shipping_cost')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('unit_price', 10, 2)->change();
            $table->decimal('cost_price', 10, 2)->change();
            $table->decimal('allocated_shipping_cost', 10, 2)->change();

            DB::statement('UPDATE purchase_items SET unit_price = unit_price / 100');
            DB::statement('UPDATE purchase_items SET cost_price = cost_price / 100');
            DB::statement('UPDATE purchase_items SET allocated_shipping_cost = allocated_shipping_cost / 100');
        });
    }
};
