<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * 基礎控制器
 * 
 * 提供應用程式中所有控制器的基礎功能，
 * 包括權限驗證和請求驗證
 */
abstract class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
