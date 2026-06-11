<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewMessageReportRequest;
use App\Http\Requests\StoreMessageReportRequest;
use App\Http\Resources\MessageReportResource;
use App\Models\Message;
use App\Models\MessageReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MessageReportController extends Controller
{
    public function store(StoreMessageReportRequest $request, Message $message): RedirectResponse
    {
        if ($message->attachments()->where('mime', 'like', 'audio/%')->exists()) {
            throw ValidationException::withMessages([
                'reason' => 'You cannot report audio or voice messages.',
            ]);
        }

        if (MessageReport::where('message_id', $message->id)
            ->where('reported_by', $request->user()->id)
            ->exists()) {
            throw ValidationException::withMessages([
                'reason' => 'You have already reported this message.',
            ]);
        }

        $message->reports()->create([
            ...$request->validated(),
            'reported_by' => $request->user()->id,
        ]);

        return back();
    }

    public function index(Request $request): Response
    {
        $statusFilter = $request->string('status')->trim()->value();

        $subquery = MessageReport::selectRaw('MIN(id) as id')
            ->when($statusFilter, fn ($q, $s) => $q->where('status', $s))
            ->groupBy('message_id');

        $reportsQuery = MessageReport::with([
            'message.sender',
            'message.attachments',
            'reporter',
            'reviewer',
            'siblingReports.reporter',
            'siblingReports.reviewer',
        ])
            ->withCount('siblingReports')
            ->whereIn('id', $subquery)
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END ASC")
            ->latest();

        return inertia('Admin/Reports', [
            'reports' => Inertia::scroll(fn () => MessageReportResource::collection(
                $reportsQuery->paginate(3)->withQueryString()
            )),
            'pendingCount' => MessageReport::pendingCount(),
        ]);
    }

    public function review(ReviewMessageReportRequest $request, MessageReport $messageReport): RedirectResponse
    {
        MessageReport::where('message_id', $messageReport->message_id)
            ->where('status', 'pending')
            ->update([
                'status' => $request->validated('status'),
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

        return back();
    }
}
