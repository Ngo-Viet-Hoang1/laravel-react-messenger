<?php

namespace App\Adapters;

use App\Contracts\MessageSuggestionProvider;
use App\Exceptions\MessageSuggestionUnavailableException;
use Illuminate\Support\Facades\Http;
use Throwable;

class GeminiMessageSuggestionAdapter implements MessageSuggestionProvider
{
    private const SYSTEM_PROMPT = <<<'PROMPT'
You are a professional chat message assistant.

Your task is to turn the user's current chat input into a clear, polite, natural, and professional message.

The input may be either:
* A rough message that needs rewriting.
* A writing request, such as asking you to describe something, thank someone, apologize, invite someone, or announce something.

If the input is a writing request, fulfill the request directly instead of asking the user to provide more details.

Core rules:

* Preserve the user's intended meaning.
* Keep the message concise, natural, and suitable for chat.
* Do not sound robotic, overly formal, or exaggerated.
* Do not add specific facts that are not supported by the provided context.
* Do not invent promises, deadlines, prices, personal details, or decisions.
* For description requests with limited details, write a general, natural description based only on the named subject.
* Improve tone, clarity, grammar, and professionalism.
* Avoid offensive, rude, manipulative, discriminatory, or inappropriate content.
* Do not explain your reasoning.
* Do not include markdown.
* Return only the suggested message text.

Style requirements:

* Include a suitable opening when appropriate.
* Include a clear main message.
* Include a polite thank-you or closing when appropriate.
* Friendly but professional.
* Short enough to be sent as a chat message.
* Respectful and emotionally appropriate.
* Avoid unnecessary emojis unless the conversation context clearly uses emojis.

Output:
Return exactly one suggested message.

PROMPT;

    /**
     * @throws MessageSuggestionUnavailableException
     */
    public function suggest(string $currentMessage): string
    {
        $apiKey = config('services.gemini.api_key');

        if (! is_string($apiKey) || $apiKey === '') {
            throw new MessageSuggestionUnavailableException('Message suggestion provider is not configured.');
        }

        $model = config('services.gemini.model', 'gemini-3.1-flash-lite');

        try {
            $response = Http::withHeaders([
                'x-goog-api-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])
                ->connectTimeout(5)
                ->timeout(20)
                ->retry(1, 700)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                    'system_instruction' => [
                        'parts' => [[
                            'text' => self::SYSTEM_PROMPT,
                        ]],
                    ],
                    'contents' => [[
                        'parts' => [[
                            'text' => "Current message: {$currentMessage}",
                        ]],
                    ]],
                ])->throw();
        } catch (Throwable $exception) {
            throw new MessageSuggestionUnavailableException(
                'Message suggestion provider request failed.',
                previous: $exception
            );
        }

        $suggestion = $response->json('candidates.0.content.parts.0.text');

        if (! is_string($suggestion) || trim($suggestion) === '') {
            throw new MessageSuggestionUnavailableException('Message suggestion provider returned an invalid response.');
        }

        return trim($suggestion);
    }
}
