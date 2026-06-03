<?php

namespace App\Services;

use App\Models\Channel;
use App\Repositories\Interfaces\IMessageRepo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MessageService
{
    public function __construct(
        private IMessageRepo $messageRepo
    ) {}

    public function getMessagesForChannel(Channel $channel): LengthAwarePaginator
    {
        return $this->messageRepo->getByChannel($channel, 10);
    }
}
