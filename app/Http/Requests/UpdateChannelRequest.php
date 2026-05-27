<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        $channel = $this->route('channel');

        if (! $channel || ! $this->user()) {
            return false;
        }

        if ($this->user()->is_admin) {
            return true;
        }

        return $channel->owner_id === $this->user()->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'exists:users,id', 'distinct'],
        ];
    }

    /**
     * Ensure the channel owner is always included in user_ids.
     */
    public function validated($key = null, $default = null): mixed
    {
        $data = parent::validated($key, $default);
        $channel = $this->route('channel');

        if ($channel && ! in_array($channel->owner_id, $data['user_ids'], true)) {
            $data['user_ids'][] = $channel->owner_id;
        }

        return $data;
    }
}
