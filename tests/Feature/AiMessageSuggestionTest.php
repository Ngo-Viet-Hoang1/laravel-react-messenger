<?php

namespace Tests\Feature;

use App\Models\User;
use App\Repositories\Interfaces\IChannelRepo;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiMessageSuggestionTest extends TestCase
{
    use LazilyRefreshDatabase;

    private IChannelRepo $repo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = app(IChannelRepo::class);

        config()->set('services.gemini.api_key', 'test-gemini-key');
        config()->set('services.gemini.model', 'gemini-3.1-flash-lite');
    }

    public function test_channel_member_can_generate_ai_message_suggestion(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => 'Hello, how are you?',
                        ]],
                    ],
                ]],
            ]),
        ]);

        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $response = $this->actingAs($sender)
            ->postJson(route('channels.message-suggestions.store', $channel), [
                'current_message' => 'hi how are u',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('suggestion', 'Hello, how are you?');

        Http::assertSentCount(1);
    }

    public function test_non_member_cannot_generate_ai_message_suggestion(): void
    {
        Http::fake();

        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $stranger = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $response = $this->actingAs($stranger)
            ->postJson(route('channels.message-suggestions.store', $channel), [
                'current_message' => 'hello',
            ]);

        $response->assertForbidden();
        Http::assertNothingSent();
    }

    public function test_gemini_unavailable_returns_service_unavailable(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'error' => [
                    'code' => 503,
                    'message' => 'This model is currently experiencing high demand.',
                ],
            ], 503),
        ]);

        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $response = $this->actingAs($sender)
            ->postJson(route('channels.message-suggestions.store', $channel), [
                'current_message' => 'hello team',
            ]);

        $response
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'AI is temporarily unavailable. Please try again later.');
    }

    public function test_missing_gemini_api_key_returns_service_unavailable(): void
    {
        Http::fake();
        config()->set('services.gemini.api_key', '');

        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $channel = $this->repo->findOrCreateDirect($sender->id, $receiver->id);

        $response = $this->actingAs($sender)
            ->postJson(route('channels.message-suggestions.store', $channel), [
                'current_message' => 'hello team',
            ]);

        $response
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'AI is temporarily unavailable. Please try again later.');

        Http::assertNothingSent();
    }
}
