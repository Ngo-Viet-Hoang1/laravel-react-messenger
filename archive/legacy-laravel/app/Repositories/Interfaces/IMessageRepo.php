<?php

namespace App\Repositories\Interfaces;

use App\Models\Channel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface IMessageRepo
{
    public function getByChannel(Channel $channel, int $perPage): LengthAwarePaginator;

    public function searchInChannel(Channel $channel, string $query, int $perPage): LengthAwarePaginator;
}
