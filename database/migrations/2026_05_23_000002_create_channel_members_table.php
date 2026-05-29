<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('channel_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('channel_id')
                ->constrained('channels')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamps();

            // Prevent duplicate membership
            $table->unique(['channel_id', 'user_id']);
            // Composite index: user_id FIRST — optimizes "get all channels for user" query
            // This is the most frequent read query in the entire application
            $table->index(['user_id', 'channel_id'], 'idx_channel_members_user_channel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('channel_members');
    }
};
