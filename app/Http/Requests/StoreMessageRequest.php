<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'message' => ['nullable', 'required_without:attachments', 'string', 'max:1000'],
            'group_id' => [
                'nullable',
                'integer',
                'required_without:receiver_id',
                'prohibits:receiver_id',
                Rule::exists('groups', 'id'),
                Rule::exists('group_users', 'group_id')->where(fn($query) => $query->where('user_id', $userId)),
            ],
            'receiver_id' => [
                'nullable',
                'integer',
                'required_without:group_id',
                'prohibits:group_id',
                Rule::exists('users', 'id'),
                Rule::notIn([$userId]),
            ],
            'attachments' => ['nullable', 'array', 'required_without:message', 'max:10'],
            'attachments.*' => ['file', 'max:1024000'],
        ];
    }
}
