<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ActiveUser
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->user()->blocked_at) {
            auth()->logout();

            return redirect()
                ->route('login')
                ->with('errorMessage', 'Your account has been blocked.');
        }
        return $next($request);
    }
}
