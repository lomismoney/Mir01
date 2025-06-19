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
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            // 創建 customer_id 並建立外鍵關聯，設置級聯刪除
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->string('address'); // 運送地址
            $table->boolean('is_default')->default(false); // 是否為預設地址
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
    }
};
