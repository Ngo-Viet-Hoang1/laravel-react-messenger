<x-mail::message>
    Hello {{ $user->name }},

    @if($user->is_admin)
        Your role has been changed to Admin. You now have full access to the system.
    @else
        Your role has been changed to User. Your access to the system has been limited.
    @endif
    Thank you,<br>
    {{ config('app.name') }}
</x-mail::message>