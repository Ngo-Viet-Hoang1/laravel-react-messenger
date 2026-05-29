<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('channels', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['direct', 'group'])->default('group');
            // direct_key: "{min_user_id}:{max_user_id}" — max 41 chars, VARCHAR(50) safe
            // Ensures only ONE DM channel between any 2 users
            $table->string('direct_key', 50)->unique()->nullable();
            // nullable: direct channels have no name (display is derived from other user)
            $table->string('name')->nullable();
            $table->string('description', 1000)->nullable();
            // nullable: direct channels have no owner
            $table->foreignId('owner_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            // PLAIN COLUMN — no FK constraint to avoid circular FK with messages
            // Updated exclusively by MessageObserver (created/deleted hooks)
            $table->unsignedBigInteger('last_message_id')->nullable();
            $table->timestamps();

            $table->index('type');
            // direct_key already indexed via ->unique()
            // owner_id index via foreignId
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('channels');
    }
};
