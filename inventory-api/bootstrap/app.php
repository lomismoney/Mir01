<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use App\Exceptions\Business\InsufficientStockException;
use App\Exceptions\Business\InvalidStatusTransitionException;
use App\Exceptions\Business\OrderNotFoundException;
use App\Exceptions\Business\RefundException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // 為 API 路由添加 CORS 中間件支援 (XAMPP 環境)
        // 必須在其他中間件之前處理 CORS
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
        
        // 處理庫存不足異常
        $exceptions->render(function (InsufficientStockException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json($e->toArray(), $e->getCode());
            }
        });
        
        // 處理無效狀態轉換異常
        $exceptions->render(function (InvalidStatusTransitionException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json($e->toArray(), $e->getCode());
            }
        });
        
        // 處理訂單不存在異常
        $exceptions->render(function (OrderNotFoundException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json($e->toArray(), $e->getCode());
            }
        });
        
        // 處理退款異常
        $exceptions->render(function (RefundException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json($e->toArray(), $e->getCode());
            }
        });
    })->create();
