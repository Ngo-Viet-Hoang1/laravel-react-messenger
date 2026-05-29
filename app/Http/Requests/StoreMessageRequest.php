<?php

namespace App\Http\Requests;

use App\Models\Channel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $channel = $this->route('channel');

        if (! $channel || ! $this->user()) {
            return false;
        }

        $channelId = $channel instanceof Channel ? $channel->id : (int) $channel;

        return $this->user()->channels()->whereKey($channelId)->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'content' => ['nullable', 'required_without:attachments', 'string', 'max:1000'],
            'parent_id' => ['nullable', 'integer', Rule::exists('messages', 'id')],
            'attachments' => ['nullable', 'array', 'required_without:content', 'max:10'],
            'attachments.*' => ['file', 'max:1024000'],
        ];
    }
}
