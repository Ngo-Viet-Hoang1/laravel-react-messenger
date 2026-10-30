<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('premium_expires_at')->nullable()->after('blocked_at');
            $table->timestamp('premium_started_at')->nullable()->after('premium_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['premium_expires_at', 'premium_started_at']);
        });
    }
};
