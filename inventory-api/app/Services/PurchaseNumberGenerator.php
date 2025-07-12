<?php

namespace App\Services;

/**
 * 進貨單編號生成器
 * 
 * 生成格式：PO-YYYYMMDD-NNNN
 * 例如：PO-20250715-0001
 */
class PurchaseNumberGenerator extends SequenceGenerator
{
    protected string $prefix = 'PO-';
    protected int $length = 16; // PO- + YYYYMMDD + - + 4位數字
    protected bool $includeDate = true;
    protected string $dateFormat = 'Ymd-'; // 年月日格式加破折號
    protected string $tableName = 'purchases';
    protected string $numberField = 'purchase_number';
    protected string $cachePrefix = 'purchase_number';
}