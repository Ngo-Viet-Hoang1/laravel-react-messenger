<?php

use App\Http\Controllers\ChannelController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('dashboard');

    Route::get('/channels', [ChannelController::class, 'index'])->name('channels.index');
    Route::post('/channels', [ChannelController::class, 'store'])->name('channels.store');
    Route::get('/channels/{channel}', [ChannelController::class, 'show'])->name('channels.show');
    Route::put('/channels/{channel}', [ChannelController::class, 'update'])->name('channels.update');
    Route::delete('/channels/{channel}', [ChannelController::class, 'destroy'])->name('channels.destroy');
    Route::patch('/channels/{channel}/read', [ChannelController::class, 'markAsRead'])->name('channels.read');

    Route::get('/channels/{channel}/members', [ChannelController::class, 'getMembers'])->name('channels.members');
    Route::post('/channels/direct/{user}', [ChannelController::class, 'findOrCreateDirect'])->name('channels.direct');

    Route::get('/channels/{channel}/messages', [MessageController::class, 'index'])->name('channels.messages');
    Route::post('/channels/{channel}/messages', [MessageController::class, 'store'])->name('channels.messages.store');

    Route::delete('/messages/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::middleware('admin')->group(function () {
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}/promote', [UserController::class, 'promote'])->name('users.promote');
        Route::patch('/users/{user}/demote', [UserController::class, 'demote'])->name('users.demote');
        Route::patch('/users/{user}/block', [UserController::class, 'block'])->name('users.block');
        Route::patch('/users/{user}/unblock', [UserController::class, 'unblock'])->name('users.unblock');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
