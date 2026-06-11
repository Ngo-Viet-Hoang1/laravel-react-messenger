<?php

namespace App\Contracts;

interface MessageSuggestionProvider
{
    public function suggest(string $currentMessage): string;
}
