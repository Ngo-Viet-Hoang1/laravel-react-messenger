<?php

namespace App\Http\Controllers;

use App\Events\MessageCreated;
use App\Events\MessageDeleted;
use App\Events\MessageReactionUpdated;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Requests\UploadChunkRequest;
use App\Http\Requests\ToggleReactionRequest;
use App\Http\Resources\MessageReactionResource;
use App\Http\Resources\MessageResource;
use App\Models\Channel;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\MessageReaction;
use Illuminate\Http\JsonResponse;
use App\Services\MessageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Services\ChunkUploadService;
use App\Services\VideoThumbnailService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    public function __construct(
        private MessageService $messageService,
        protected ChunkUploadService $chunkUploadService,
        protected VideoThumbnailService $videoThumbnailService
    ) {}

    public function search(Request $request, Channel $channel): AnonymousResourceCollection
    {
        $isUserInChannel = auth()->user()?->channels()->whereKey($channel->id)->exists();
        abort_unless($isUserInChannel, 403, 'Unauthorized');

        $request->validate([
            'query' => ['required', 'string', 'min:1'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $results = $this->messageService->searchMessages(
            $channel,
            $request->string('query')->toString(),
        );

        return MessageResource::collection($results);
    }

    public function index(Channel $channel)
    {
        $isUserInChannel = auth()->user()?->channels()->whereKey($channel->id)->exists();
        abort_unless($isUserInChannel, 403, 'Unauthorized');

        $beforeId = (int) request()->query('before_id', 0);
        $beforeAt = request()->query('before_at');

        $query = Message::where('channel_id', $channel->id)
            ->with(['sender', 'attachments', 'parent.sender', 'parent.attachments', 'reactions']);

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

                    $path = $file->store($directory, 'public');
                    $mime = $file->getMimeType();
                    $thumbnailPath = null;

                    if (str_starts_with($mime, 'video/')) {
                        $thumbnailPath = $this->videoThumbnailService->generate($path, 'public');
                    }

                    MessageAttachment::create([
                        'message_id' => $message->id,
                        'path' => $path,
                        'name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime' => $mime,
                        'storage_disk' => 'public',
                        'thumbnail_path' => $thumbnailPath,
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

                        $mime = $att['mime'];
                        $thumbnailPath = null;

                        if (str_starts_with($mime, 'video/')) {
                            $thumbnailPath = $this->videoThumbnailService->generate($finalRelativePath, 'public');
                        }

                        MessageAttachment::create([
                            'message_id' => $message->id,
                            'path' => $finalRelativePath,
                            'name' => $att['name'],
                            'size' => (int) $att['size'],
                            'mime' => $mime,
                            'storage_disk' => 'public',
                            'thumbnail_path' => $thumbnailPath,
                        ]);
                    }
                }
            }

            return $message->load([
                'sender',
                'attachments',
                'parent.sender',
                'parent.attachments',
                'reactions',
            ]);
        });

        // Note: MessageObserver::created fires AFTER DB transaction completes
        // and handles last_message_id update + ChannelUpdated broadcast
        DB::afterCommit(function () use ($message) {
            broadcast(new MessageCreated($message))->toOthers();
        });

        return new MessageResource($message);
    }

    public function uploadChunk(UploadChunkRequest $request)
    {
        try {
            $result = $this->chunkUploadService->uploadChunk(
                $request->input('file_uuid'),
                (int) $request->input('chunk_index'),
                (int) $request->input('total_chunks'),
                $request->input('name'),
                $request->input('mime'),
                (int) $request->input('size'),
                $request->file('file')
            );

            return response()->json($result);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
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

    public function toggleReaction(ToggleReactionRequest $request, Message $message): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $emoji = $request->validated('emoji');

        $existing = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            if ($existing->emoji === $emoji) {
                // Same emoji → remove reaction
                $existing->delete();
            } else {
                // Different emoji → update to new one
                $existing->update(['emoji' => $emoji]);
            }
        } else {
            // No existing reaction → create new
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $userId,
                'emoji' => $emoji,
            ]);
        }

        // Update channel last_message_id to push channel to top of sidebar
        Channel::whereKey($message->channel_id)
            ->where(function ($query) use ($message) {
                $query->whereNull('last_message_id')
                    ->orWhere('last_message_id', '<=', $message->id);
            })
            ->update(['last_message_id' => $message->id]);

        // Reload reactions to get fresh aggregated data
        $message->load('reactions');
        $reactions = MessageReactionResource::aggregateForMessage($message);

        broadcast(new MessageReactionUpdated(
            $message->id,
            $message->channel_id,
            $reactions,
        ))->toOthers();

        return response()->json([
            'message_id' => $message->id,
            'channel_id' => $message->channel_id,
            'reactions' => $reactions,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMessageSnapshot(Message $message): array
    {
        $message->loadMissing(['sender', 'attachments', 'parent.sender', 'parent.attachments']);

        $formatAttachment = function (MessageAttachment $attachment) {
            $arr = $attachment->toArray();
            $arr['url'] = Storage::disk($attachment->storage_disk)->url($attachment->path);
            $arr['thumbnail_url'] = $attachment->thumbnail_path ? Storage::disk($attachment->storage_disk)->url($attachment->thumbnail_path) : null;
            $arr['stream_url'] = route('attachments.stream', $attachment->id);

            return $arr;
        };

        $attachmentsArray = [];
        foreach ($message->attachments as $attachment) {
            $attachmentsArray[] = $formatAttachment($attachment);
        }

        $parent = null;
        if ($message->parent) {
            $parentAttachments = [];
            foreach ($message->parent->attachments as $attachment) {
                $parentAttachments[] = $formatAttachment($attachment);
            }
            $parent = $message->parent->toArray();
            $parent['attachments'] = $parentAttachments;
        }

        return [
            'id' => $message->id,
            'content' => $message->content,
            'channel_id' => $message->channel_id,
            'sender_id' => $message->sender_id,
            'parent_id' => $message->parent_id,
            'sender' => $message->sender?->toArray(),
            'parent' => $parent,
            'attachments' => $attachmentsArray,
            'created_at' => $message->created_at?->toISOString(),
            'updated_at' => $message->updated_at?->toISOString(),
        ];
    }
}
