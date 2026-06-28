<?php

namespace App\Services;

use App\Contracts\MessageSuggestionProvider;

class MessageSuggestionService
{
    public function __construct(private MessageSuggestionProvider $provider) {}

    public function suggest(string $currentMessage): string
    {
        return $this->provider->suggest($currentMessage);
    }
}
