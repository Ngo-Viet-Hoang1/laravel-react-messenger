<?php

namespace App\Http\Controllers;

use App\Http\Resources\ChannelResource;
use App\Models\Channel;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        return inertia('Home', [
            'channels' => $user
                ? ChannelResource::collection(Channel::getChannelsForUser($user))->resolve(request())
                : [],
            'selectedChannel' => null,
        ]);
    }
}
