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

    'allowed_methods' => ['POST', 'GET', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost',
        'http://127.0.0.1',
        'https://internal.lomis.com.tw',
        env('FRONTEND_URL', 'https://internal.lomis.com.tw'),
    ],

    'allowed_origins_patterns' => [
        '#^https://inventory-client-[a-zA-Z0-9-]+\.asia-east1\.run\.app$#',
        '#^https://inventory-client--[a-zA-Z0-9-]+\.a\.run\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

]; 