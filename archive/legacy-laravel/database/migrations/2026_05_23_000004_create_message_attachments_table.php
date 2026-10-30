<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')
                ->constrained('messages')
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('path');
            $table->string('mime');
            $table->unsignedBigInteger('size');
            // storage_disk: default 'local', future-proof for S3, GCS etc.
            $table->string('storage_disk', 50)->default('local');
            // thumbnail_path: nullable, populated in future when thumbnail generation is implemented
            $table->string('thumbnail_path')->nullable();
            $table->timestamps();

            $table->index('message_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
    }
};
