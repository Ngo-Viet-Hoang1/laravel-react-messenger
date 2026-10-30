<?php

namespace App\Http\Requests;

use App\Models\Channel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('is_encrypted')) {
            $this->merge([
                'is_encrypted' => $this->boolean('is_encrypted'),
            ]);
        }
    }

    public function authorize(): bool
    {
        $channel = $this->route('channel');

        if (!$channel || !$this->user()) {
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
        $channel = $this->route('channel');
        $channelId = $channel instanceof Channel ? $channel->id : (int) $channel;

        return [
            'content' => ['nullable', 'required_without_all:attachments,uploaded_attachments,ciphertext', 'string', 'max:10000'],

            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('messages', 'id')->where('channel_id', $channelId),
            ],

            'attachments' => ['nullable', 'array', 'required_without_all:content,uploaded_attachments,ciphertext', 'max:10'],
            'attachments.*' => ['file', 'max:1024000'],

            'uploaded_attachments' => ['nullable', 'array', 'required_without_all:content,attachments,ciphertext'],
            'uploaded_attachments.*.path' => ['required', 'string'],
            'uploaded_attachments.*.name' => ['required', 'string'],
            'uploaded_attachments.*.mime' => ['required', 'string'],
            'uploaded_attachments.*.size' => ['required', 'integer'],

            'is_encrypted' => ['nullable', 'boolean'],
            'iv' => ['nullable', Rule::requiredIf(fn() => $this->boolean('is_encrypted')), 'string'],
            'ciphertext' => ['nullable', Rule::requiredIf(fn() => $this->boolean('is_encrypted')), 'string'],
        ];
    }
}
