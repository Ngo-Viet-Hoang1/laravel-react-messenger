<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChannelResource;
use App\Services\ChannelService;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        private ChannelService $channelService
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        $channels = $user ? ChannelResource::collection($this->channelService->getChannelsForUser($user))->resolve(request()) : [];
        $selectedChannel = null;

        return inertia('Home', compact('channels', 'selectedChannel'));
    }
}
