<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Design: is_e2ee_enabled là IMMUTABLE sau khi channel được tạo.
     *
     * Lý do không cho phép convert regular → E2EE:
     *  - Các tin nhắn cũ vẫn là plaintext — không thể retroactively encrypt
     *  - Elasticsearch đã index chúng — không thể "un-index"
     *  - UX rõ ràng hơn: tạo Secret Chat mới = slate trắng, toàn bộ E2EE từ đầu
     *
     * direct_key convention (application-level, không cần DB change):
     *  Regular DM : "{min_user_id}:{max_user_id}"       e.g. "3:7"
     *  Secret Chat: "e2ee:{min_user_id}:{max_user_id}"  e.g. "e2ee:3:7"
     *
     * Lý do cần prefix "e2ee:": unique constraint trên direct_key cho phép
     * cùng 2 user có BOTH regular DM AND Secret Chat đồng thời (như Telegram).
     * VARCHAR(50) đủ chỗ: "e2ee:" (5) + max 20 digits + ":" + max 20 digits = 46 chars.
     */
    public function up(): void
    {
        Schema::table('channels', function (Blueprint $table): void {
            $table->boolean('is_e2ee_enabled')
                ->default(false)
                ->after('type')
                ->comment('Immutable. When true: server stores only ciphertext, no Elasticsearch indexing.');
        });
    }

    public function down(): void
    {
        Schema::table('channels', function (Blueprint $table): void {
            $table->dropColumn('is_e2ee_enabled');
        });
    }
};
