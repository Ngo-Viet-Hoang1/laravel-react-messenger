<x-mail::message>
    Hello {{ $user->name }},

    @if($user->blocked_at)
        Your account has been blocked. Please contact support for more information.
    @else
        Your account has been activated.
    <x-mail::button :url="route('login')">
        Click here to login
    </x-mail::button>
    @endif

    Thank you,<br>
    {{ config('app.name') }}

</x-mail::message>