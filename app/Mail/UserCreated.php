<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserCreated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $rawPassword)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your account has been created',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.user-created',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
