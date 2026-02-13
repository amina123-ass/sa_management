<?php

return [
    'admin_email' => env('ADMIN_EMAIL', 'dmsps.sefrou@gmail.com'),

    'default' => env('MAIL_MAILER', 'smtp'),

    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME'),
            'url' => env('MAIL_URL'),
            'host' => env('MAIL_HOST', 'smtp.gmail.com'),
            'port' => env('MAIL_PORT', 587),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => 30,
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url(env('APP_URL', 'http://192.168.1.45:3001'), PHP_URL_HOST)),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
            'retry_after' => 60,
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'dmsps.sefrou@gmail.com'),
        'name' => env('MAIL_FROM_NAME', 'SA Management'),
    ],
];