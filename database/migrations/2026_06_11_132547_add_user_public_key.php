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
        Schema::table('users', function (Blueprint $table) {
            /*
             * User public key for end-to-end encryption. This is the public key corresponding to the private key that the user holds.
             *
             * Save as JWK to allow for flexibility in key types and algorithms. For example, for an EC key, the JWK would look like:
             * {
             *   "kty": "EC",
             *   "crv": "P-256",
             *   "x": "...",
             *   "y": "..."
             * }
             */
            $table->json('public_key')->nullable()->after('password');
            $table->string('public_key_fingerprint', 64)->nullable()->after('public_key');
            $table->unsignedInteger('key_version')->default(1)->after('public_key_fingerprint');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('public_key');
            $table->dropColumn('public_key_fingerprint');
            $table->dropColumn('key_version');
        });
    }
};
