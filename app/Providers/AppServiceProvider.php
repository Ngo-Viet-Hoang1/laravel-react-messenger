<?php

namespace App\Providers;

use App\Repositories\Eloquent\ChannelRepo;
use App\Repositories\Eloquent\MessageRepo;
use App\Repositories\Interfaces\IChannelRepo;
use App\Repositories\Interfaces\IMessageRepo;
use App\Patterns\TemplateMethod\DirectChannel\DirectCreator;
use App\Patterns\TemplateMethod\DirectChannel\E2EEDirectCreator;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(IChannelRepo::class, ChannelRepo::class);
        $this->app->bind(IMessageRepo::class, MessageRepo::class);
        $this->app->bind(DirectCreator::class);
        $this->app->bind(E2EEDirectCreator::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
