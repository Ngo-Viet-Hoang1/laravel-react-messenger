<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadChunkRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'file_uuid' => ['required', 'string'],
            'chunk_index' => ['required', 'integer'],
            'total_chunks' => ['required', 'integer'],
            'name' => ['required', 'string'],
            'size' => ['required', 'integer'],
            'mime' => ['required', 'string'],
            'file' => ['required', 'file'],
        ];
    }
}
