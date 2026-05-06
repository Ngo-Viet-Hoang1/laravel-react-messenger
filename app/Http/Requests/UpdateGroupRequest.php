<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGroupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $group = $this->route('group');

        if (! $group || ! $this->user()) {
            return false;
        }

        if ($this->user()->is_admin) {
            return true;
        }

        return $group->owner_id === $this->user()->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'user_ids' => 'required|array|min:2',
            'user_ids.*' => 'integer|exists:users,id|distinct',
        ];
    }

    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);
        $group = $this->route('group');

        if ($group && ! in_array($group->owner_id, $data['user_ids'], true)) {
            $data['user_ids'][] = $group->owner_id;
        }

        return $data;
    }
}
