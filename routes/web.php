<?php

use App\Http\Controllers\ChannelController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MessageReportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserKeyController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('dashboard');

    Route::get('/channels', [ChannelController::class, 'index'])->name('channels.index');
    Route::post('/channels', [ChannelController::class, 'store'])->name('channels.store');
    Route::get('/channels/{channel}', [ChannelController::class, 'show'])->name('channels.show');
    Route::put('/channels/{channel}', [ChannelController::class, 'update'])->name('channels.update');
    Route::delete('/channels/{channel}', [ChannelController::class, 'destroy'])->name('channels.destroy');
    Route::post('/channels/{channel}/read', [ChannelController::class, 'markAsRead'])->name('channels.read');

    Route::get('/channels/{channel}/messages', [MessageController::class, 'index'])->name('channels.messages');
    Route::post('/channels/{channel}/messages', [MessageController::class, 'store'])->name('channels.messages.store');

    Route::delete('/messages/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');

    Route::post('/messages/{message}/report', [MessageReportController::class, 'store'])->name('messages.report');

    Route::post('/messages/upload-chunk', [MessageController::class, 'uploadChunk'])->name('messages.upload-chunk');

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::put('/users/public-key', [UserKeyController::class, 'update'])->name('users.key.update');
    Route::get('/users/{user}/public-key', [UserKeyController::class, 'show'])->name('users.public-key');

    Route::middleware('admin')->group(function () {
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}/promote', [UserController::class, 'promote'])->name('users.promote');
        Route::patch('/users/{user}/demote', [UserController::class, 'demote'])->name('users.demote');
        Route::patch('/users/{user}/block', [UserController::class, 'block'])->name('users.block');
        Route::patch('/users/{user}/unblock', [UserController::class, 'unblock'])->name('users.unblock');
        Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        Route::get('/admin/users', [UserController::class, 'adminIndex'])->name('admin.users.index');
        Route::get('/admin/reports', [MessageReportController::class, 'index'])->name('admin.reports.index');
        Route::patch('/admin/reports/{messageReport}', [MessageReportController::class, 'review'])->name('admin.reports.review');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
