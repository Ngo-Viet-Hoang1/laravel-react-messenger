<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('premium_payments', function (Blueprint $table): void {
            $table->uuid('create_request_id')->nullable()->unique()->after('provider_order_id');
            $table->uuid('capture_request_id')->nullable()->unique()->after('create_request_id');
        });
    }

    public function down(): void
    {
        Schema::table('premium_payments', function (Blueprint $table): void {
            $table->dropColumn(['create_request_id', 'capture_request_id']);
        });
    }
};
