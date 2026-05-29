<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            // CASCADE: deleting a channel cascades deletes all its messages
            $table->foreignId('channel_id')
                ->constrained('channels')
                ->cascadeOnDelete();
            // CASCADE: deleting a user hard-deletes their sent messages
            $table->foreignId('sender_id')
                ->constrained('users')
                ->cascadeOnDelete();
            // 1-level reply only. SET NULL: parent deleted → reply survives with parent_id=null
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('messages')
                ->nullOnDelete();
            // nullable: message can be attachment-only
            $table->longText('message')->nullable();
            $table->timestamps();

            // idx_channel_created: used for paginated message loading (byChannel query)
            $table->index(['channel_id', 'created_at'], 'idx_messages_channel_created');
            // idx_parent: used for loading replies
            $table->index('parent_id', 'idx_messages_parent');
            // idx_sender: used for user activity queries
            $table->index(['sender_id', 'created_at'], 'idx_messages_sender_created');
        });

        // After messages table exists, add FK for channels.last_message_id as plain column
        // NOTE: We deliberately do NOT add a FK constraint here.
        // last_message_id is updated via MessageObserver only.
        // Adding FK would create a circular dependency: channels ↔ messages
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
