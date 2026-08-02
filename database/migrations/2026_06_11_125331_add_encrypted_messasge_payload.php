<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->boolean('is_encrypted')->default(false)->after('content');

            $table->text('iv')->nullable()->after('is_encrypted');

            $table->longText('ciphertext')->nullable()->after('iv');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('is_encrypted');
            $table->dropColumn('iv');
            $table->dropColumn('ciphertext');
        });
    }
};
