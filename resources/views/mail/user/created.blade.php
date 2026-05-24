<x-mail::message>
    Hello {{ $user->name }},

    Your account has been created successfully.

    **Here is your login information:**
    Email: {{ $user->email }}
    Password: {{ $password }}

    Please log into the system and change your password.

    <x-mail::button :url="route('login')">
        Click here to login
    </x-mail::button>

    Thank you,<br>
    {{ config('app.name') }}
</x-mail::message>
