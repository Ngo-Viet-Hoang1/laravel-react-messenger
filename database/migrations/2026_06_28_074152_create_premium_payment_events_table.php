<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('premium_payment_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('premium_payment_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['premium_payment_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('premium_payment_events');
    }
};
