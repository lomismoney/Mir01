<?php

/*
 * This file is part of the API Platform project.
 *
 * (c) Kévin Dunglas <dunglas@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare(strict_types=1);

use ApiPlatform\Metadata\UrlGeneratorInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Symfony\Component\Serializer\NameConverter\SnakeCaseToCamelCaseNameConverter;

return [
    'title' => '庫存管理系統 API v2.0',
    'description' => '基於 API Platform 的企業級 RESTful API',
    'version' => '2.0.0',
    'show_webby' => true,

    'routes' => [
        'domain' => null,
        // 全域中間件 - 使用 Sanctum 認證
        'middleware' => ['auth:sanctum']
    ],

    'resources' => [
        app_path('Models'),
        app_path('ApiResource'), // 未來的 DTO
    ],

    'formats' => [
        'json' => ['application/json'],
        'jsonld' => ['application/ld+json'], // 保留語義支援
    ],

    'patch_formats' => [
        'json' => ['application/merge-patch+json'],
    ],

    'docs_formats' => [
        'jsonld' => ['application/ld+json'],
        'jsonopenapi' => ['application/vnd.openapi+json'],
        'html' => ['text/html'],
    ],

    'error_formats' => [
        'jsonproblem' => ['application/problem+json'],
    ],

    'defaults' => [
        'pagination_enabled' => true,
        'pagination_partial' => false,
        'pagination_client_enabled' => true,
        'pagination_client_items_per_page' => true,
        'pagination_client_partial' => false,
        'pagination_items_per_page' => 15, // 與現有系統一致
        'pagination_maximum_items_per_page' => 100,
        'route_prefix' => '/api',
        'middleware' => ['auth:sanctum'],
    ],

    'pagination' => [
        'page_parameter_name' => 'page',
        'enabled_parameter_name' => 'pagination',
        'items_per_page_parameter_name' => 'per_page', // 與現有系統一致
        'partial_parameter_name' => 'partial',
    ],

    'graphql' => [
        'enabled' => false, // 專注於 REST API
        'nesting_separator' => '__',
        'introspection' => ['enabled' => true],
        'max_query_complexity' => 500,
        'max_query_depth' => 200,
    ],

    // 保持 snake_case 與現有 API 一致
    'name_converter' => null,

    'exception_to_status' => [
        AuthenticationException::class => 401,
        AuthorizationException::class => 403,
    ],

    'swagger_ui' => [
        'enabled' => true,
        'apiKeys' => [
            'api' => [
                'type' => 'Bearer',
                'name' => 'Authorization',
                'in' => 'header'
            ]
        ],
    ],

    'openapi' => [
        'tags' => [
            ['name' => 'Products', 'description' => '商品管理'],
            ['name' => 'Orders', 'description' => '訂單管理'],
            ['name' => 'Inventory', 'description' => '庫存管理'],
            ['name' => 'Stores', 'description' => '分店管理'],
            ['name' => 'Customers', 'description' => '客戶管理'],
            ['name' => 'Auth', 'description' => '認證相關'],
        ]
    ],

    'url_generation_strategy' => UrlGeneratorInterface::ABS_PATH,

    'serializer' => [
        'hydra_prefix' => false,
        'datetime_format' => \DateTimeInterface::ATOM, // ISO 8601
    ],

    // 使用檔案快取以提升性能
    'cache' => 'file',
];
