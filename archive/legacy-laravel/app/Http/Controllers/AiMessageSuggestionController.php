<?php

namespace App\Http\Controllers;

use App\Exceptions\MessageSuggestionUnavailableException;
use App\Http\Requests\StoreAiMessageSuggestionRequest;
use App\Models\Channel;
use App\Services\MessageSuggestionService;
use Illuminate\Http\JsonResponse;

class AiMessageSuggestionController extends Controller
{
    public function store(
        StoreAiMessageSuggestionRequest $request,
        Channel $channel,
        MessageSuggestionService $service
    ): JsonResponse {
        $data = $request->validated();

        try {
            $suggestion = $service->suggest($data['current_message']);
        } catch (MessageSuggestionUnavailableException) {
            return response()->json([
                'message' => 'AI is temporarily unavailable. Please try again later.',
            ], 503);
        }

        return response()->json([
            'suggestion' => $suggestion,
        ]);
    }
}
