<?php

namespace App\Services;

/**
 * 訂單編號生成器
 * 
 * 生成格式：SO-YYYYMMDD-NNNN
 * 例如：SO-20250715-0001
 */
class OrderNumberGenerator extends SequenceGenerator
{
    protected string $prefix = 'SO-';
    protected int $length = 16; // SO- + YYYYMMDD + - + 4位數字
    protected bool $includeDate = true;
    protected string $dateFormat = 'Ymd-'; // 年月日格式加破折號
    protected string $tableName = 'orders';
    protected string $numberField = 'order_number';
    protected string $cachePrefix = 'order_number';
}