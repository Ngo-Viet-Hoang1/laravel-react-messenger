<?php

namespace App\Http\Requests;

use App\Models\Channel;
use Illuminate\Foundation\Http\FormRequest;

class StoreAiMessageSuggestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $channel = $this->route('channel');

        if (! $channel instanceof Channel || ! $this->user()) {
            return false;
        }

        return $this->user()->channels()->whereKey($channel->id)->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_message' => ['required', 'string', 'max:2000'],
        ];
    }
}
