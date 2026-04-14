<?php

return [

    /*
     |--------------------------------------------------------------------------
     | Cross-Origin Resource Sharing (CORS) Configuration
     |--------------------------------------------------------------------------
     |
     | Here you may configure your settings for cross-origin resource sharing
     | or "CORS". This determines what cross-origin operations may execute
     | in web browsers. You are free to adjust these settings as needed.
     |
     | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
     |
     */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_filter([
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        env('FRONTEND_URL'), // URL del frontend en producción
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,

];
