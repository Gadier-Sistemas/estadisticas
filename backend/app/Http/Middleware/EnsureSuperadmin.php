<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSuperadmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        if (! $request->user() || $request->user()->rol !== 'superadmin') {
            return response()->json(['message' => 'No autorizado. Se requiere nivel de superadmin.'], 403);
        }

        return $next($request);
    }
}
