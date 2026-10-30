<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
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
     * Ensure the creator is always included in user_ids.
     */
    public function validated($key = null, $default = null): mixed
    {
        $data = parent::validated($key, $default);

        if (! in_array($this->user()->id, $data['user_ids'], true)) {
            $data['user_ids'][] = $this->user()->id;
        }

        $data['owner_id'] = $this->user()->id;

        return $data;
    }
}
