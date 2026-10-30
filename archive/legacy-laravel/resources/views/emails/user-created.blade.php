<x-mail::message>
Hello {{ $user->name }},

Your account has been created successfully.

** Here are your login credentials: ** <br>
Email: {{ $user->email }} <br>
Password: {{ $rawPassword }}

Please log in and change your password as soon as possible.

<x-mail::button :url="url('/login')">
Click here to Login
</x-mail::button>

Best regards, <br>
{{ config('app.name', 'Laravel Discord Messenger')  }}

</x-mail::message>
