<?php

namespace App\Repositories\Eloquent;

use App\Models\Channel;
use App\Models\Message;
use App\Repositories\Interfaces\IMessageRepo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MessageRepo implements IMessageRepo
{
    private const array MESSAGE_EAGER_LOADS = [
        'sender:id,name,avatar_url',
        'attachments',
        'parent.sender:id,name,avatar_url',
        'parent.attachments',
    ];

    public function getByChannel(Channel $channel, int $perPage): LengthAwarePaginator
    {
        return Message::where('channel_id', $channel->id)
            ->with(self::MESSAGE_EAGER_LOADS)
            ->latest()
            ->paginate($perPage);
    }

    public function searchInChannel(Channel $channel, string $query, int $perPage): LengthAwarePaginator
    {
        return Message::where('channel_id', $channel->id)
            ->whereNotNull('content')
            ->where(function ($q) use ($query) {
                $driver = DB::connection()->getDriverName();
                $cleanQuery = trim($query);

                // MySQL Fulltext requires search terms to be >= innodb_ft_min_token_size (default 3)
                // For shorter queries, or SQLite, we fallback to standard LIKE search
                if ($driver === 'mysql' && mb_strlen($cleanQuery) >= 3) {
                    $words = preg_split('/\s+/', $cleanQuery);
                    $formattedQuery = '';
                    foreach ($words as $word) {
                        if (mb_strlen($word) >= 3) {
                            $formattedQuery .= $word.'* ';
                        } else {
                            $formattedQuery .= $word.' ';
                        }
                    }
                    $formattedQuery = trim($formattedQuery);

                    if (! empty($formattedQuery)) {
                        $q->whereFullText('content', $formattedQuery, ['mode' => 'boolean']);
                    } else {
                        $q->where('content', 'like', '%'.$cleanQuery.'%');
                    }
                } else {
                    $q->where('content', 'like', '%'.$cleanQuery.'%');
                }
            })
            ->with(self::MESSAGE_EAGER_LOADS)
            ->latest()
            ->paginate($perPage);
    }
}
