<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// 圖片服務路由
Route::get('/storage/{path}', function ($path) {
    // 驗證路徑格式
    if (!preg_match('/^[\d\/]+[a-zA-Z0-9\-._]+\.(jpg|jpeg|png|gif|webp)$/i', $path)) {
        abort(404);
    }
    
    $disk = config('media-library.disk_name', 'public');
    
    if (!Storage::disk($disk)->exists($path)) {
        abort(404);
    }
    
    $file = Storage::disk($disk)->get($path);
    $mimeType = Storage::disk($disk)->mimeType($path);
    
    return response($file, 200)
        ->header('Content-Type', $mimeType)
        ->header('Cache-Control', 'public, max-age=31536000')
        ->header('Access-Control-Allow-Origin', '*');
})->where('path', '.*');
