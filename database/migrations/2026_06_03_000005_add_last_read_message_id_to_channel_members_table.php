<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('channel_members', function (Blueprint $table): void {
            $table->unsignedBigInteger('last_read_message_id')
                ->nullable()
                ->after('user_id');

            $table->index(['channel_id', 'user_id', 'last_read_message_id'], 'idx_channel_members_read_state');
        });
    }

    public function down(): void
    {
        Schema::table('channel_members', function (Blueprint $table): void {
            $table->dropIndex('idx_channel_members_read_state');
            $table->dropColumn('last_read_message_id');
        });
    }
};
