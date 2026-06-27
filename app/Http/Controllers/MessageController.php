<?php

namespace App\Http\Controllers;

use App\Events\MessageCreated;
use App\Events\MessageDeleted;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Channel;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    public function index(Channel $channel)
    {
        $isUserInChannel = auth()->user()?->channels()->whereKey($channel->id)->exists();
        abort_unless($isUserInChannel, 403, 'Unauthorized');

        $beforeId = (int) request()->query('before_id', 0);
        $beforeAt = request()->query('before_at');

        $query = Message::where('channel_id', $channel->id)
            ->with(['sender', 'attachments', 'parent.sender', 'parent.attachments']);

        if ($beforeId && $beforeAt) {
            $query->where(function ($q) use ($beforeAt, $beforeId) {
                $q->where('created_at', '<', $beforeAt)
                    ->orWhere(function ($q2) use ($beforeAt, $beforeId) {
                        $q2->where('created_at', $beforeAt)
                            ->where('id', '<', $beforeId);
                    });
            });
        }

        $messages = $query
            ->latest()
            ->orderByDesc('id')
            ->paginate(10);

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request, Channel $channel)
    {
        $data = $request->validated();
        $data['sender_id'] = (int) $request->user()->id;
        $data['channel_id'] = $channel->id;

        if ($data['is_encrypted'] ?? false) {
            abort_unless($channel->is_e2ee_enabled, 422, 'Cannot send encrypted messages to a non-E2EE channel.');
            $data['content'] = null;
        }
        if ($channel->is_e2ee_enabled && !($data['is_encrypted'] ?? false)) {
            abort(422, 'E2EE channel requires encrypted messages.');
        }

        $files = $data['attachments'] ?? [];
        $uploadedAttachments = $data['uploaded_attachments'] ?? [];
        unset($data['attachments'], $data['uploaded_attachments']);

        $message = DB::transaction(function () use ($data, $files, $uploadedAttachments) {
            $message = Message::create($data);

            if ($files !== []) {
                foreach ($files as $file) {
                    $directory = 'attachments/' . Str::random(40);
                    Storage::disk('public')->makeDirectory($directory);

                    MessageAttachment::create([
                        'message_id' => $message->id,
                        'path' => $file->store($directory, 'public'),
                        'name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'storage_disk' => 'public',
                        'thumbnail_path' => null,
                    ]);
                }
            }

            if ($uploadedAttachments !== []) {
                foreach ($uploadedAttachments as $att) {
                    $tempPath = storage_path('app/' . $att['path']);
                    if (file_exists($tempPath)) {
                        $directory = 'attachments/' . Str::random(40);
                        Storage::disk('public')->makeDirectory($directory);

                        $ext = pathinfo($att['name'], PATHINFO_EXTENSION);
                        $filename = Str::random(40) . ($ext ? '.' . $ext : '');
                        $finalRelativePath = $directory . '/' . $filename;
                        $finalPath = Storage::disk('public')->path($finalRelativePath);

                        // Move the merged chunk file to its final public storage directory
                        rename($tempPath, $finalPath);

                        // Clean up the temp chunks directory for this file UUID
                        $tempDir = dirname($tempPath);
                        if (file_exists($tempDir)) {
                            @rmdir($tempDir);
                        }

                        MessageAttachment::create([
                            'message_id' => $message->id,
                            'path' => $finalRelativePath,
                            'name' => $att['name'],
                            'size' => (int) $att['size'],
                            'mime' => $att['mime'],
                            'storage_disk' => 'public',
                            'thumbnail_path' => null,
                        ]);
                    }
                }
            }

            return $message->load([
                'sender',
                'attachments',
                'parent.sender',
                'parent.attachments',
            ]);
        });

        // Note: MessageObserver::created fires AFTER DB transaction completes
        // and handles last_message_id update + ChannelUpdated broadcast
        DB::afterCommit(function () use ($message) {
            broadcast(new MessageCreated($message))->toOthers();
        });

        return new MessageResource($message);
    }

    public function uploadChunk(Request $request)
    {
        $request->validate([
            'file_uuid' => ['required', 'string'],
            'chunk_index' => ['required', 'integer'],
            'total_chunks' => ['required', 'integer'],
            'name' => ['required', 'string'],
            'size' => ['required', 'integer'],
            'mime' => ['required', 'string'],
            'file' => ['required', 'file'],
        ]);

        $fileUuid = $request->input('file_uuid');
        $chunkIndex = (int) $request->input('chunk_index');
        $totalChunks = (int) $request->input('total_chunks');
        $fileName = $request->input('name');
        $fileMime = $request->input('mime');
        $fileSize = (int) $request->input('size');
        $chunkFile = $request->file('file');

        $tempDir = storage_path('app/chunks/' . $fileUuid);
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $chunkFile->move($tempDir, (string) $chunkIndex);

        $uploadedCount = 0;
        for ($i = 0; $i < $totalChunks; $i++) {
            if (file_exists($tempDir . '/' . $i)) {
                $uploadedCount++;
            }
        }

        if ($uploadedCount === $totalChunks) {
            $mergedFilePath = $tempDir . '/merged';
            $out = fopen($mergedFilePath, 'wb');
            if ($out === false) {
                return response()->json(['error' => 'Failed to open output stream'], 500);
            }

            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkPath = $tempDir . '/' . $i;
                $in = fopen($chunkPath, 'rb');
                if ($in === false) {
                    fclose($out);

                    return response()->json(['error' => 'Failed to open chunk ' . $i], 500);
                }
                while ($buff = fread($in, 4096)) {
                    fwrite($out, $buff);
                }
                fclose($in);
            }
            fclose($out);

            // Clean up chunks
            for ($i = 0; $i < $totalChunks; $i++) {
                @unlink($tempDir . '/' . $i);
            }

            return response()->json([
                'status' => 'completed',
                'path' => 'chunks/' . $fileUuid . '/merged',
                'name' => $fileName,
                'mime' => $fileMime,
                'size' => $fileSize,
            ]);
        }

        return response()->json([
            'status' => 'uploading',
            'progress' => round(($uploadedCount / $totalChunks) * 100),
        ]);
    }

    public function destroy(Message $message)
    {
        abort_unless($message->sender_id === auth()->id(), 403);

        $newLastMessage = null;
        $deletedSnapshot = $this->buildMessageSnapshot($message);

        DB::transaction(function () use ($message, &$newLastMessage) {
            $channelId = $message->channel_id;
            $deletedMessageId = $message->id;

            $message->delete(); // triggers Observer::deleting + Observer::deleted

            // Observer already recomputed last_message_id, fetch updated value
            $channel = Channel::find($channelId);
            if ($channel && (int) $channel->last_message_id !== $deletedMessageId) {
                $newLastMessage = Message::find($channel->last_message_id);
            }
        });

        $deletedSnapshot['deleted_at'] = now()->toISOString();

        if ($newLastMessage) {
            $newLastMessage = $this->buildMessageSnapshot($newLastMessage);
        }

        DB::afterCommit(function () use ($deletedSnapshot, $newLastMessage): void {
            broadcast(new MessageDeleted($deletedSnapshot, $newLastMessage))->toOthers();
        });

        return response()->json([
            'message' => $deletedSnapshot,
            'newLastMessage' => $newLastMessage,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMessageSnapshot(Message $message): array
    {
        $message->loadMissing(['sender', 'attachments', 'parent.sender', 'parent.attachments']);

        return [
            'id' => $message->id,
            'content' => $message->content,
            'channel_id' => $message->channel_id,
            'sender_id' => $message->sender_id,
            'parent_id' => $message->parent_id,
            'sender' => $message->sender?->toArray(),
            'parent' => $message->parent?->toArray(),
            'attachments' => $message->attachments->toArray(),
            'created_at' => $message->created_at?->toISOString(),
            'updated_at' => $message->updated_at?->toISOString(),
        ];
    }
}
