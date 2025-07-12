<?php

namespace App\Services;

/**
 * 安裝單編號生成器
 * 
 * 生成格式：IN-YYYYMMDD-NNNN
 * 例如：IN-20250715-0001
 */
class InstallationNumberGenerator extends SequenceGenerator
{
    protected string $prefix = 'IN-';
    protected int $length = 16; // IN- + YYYYMMDD + - + 4位數字
    protected bool $includeDate = true;
    protected string $dateFormat = 'Ymd-'; // 年月日格式加破折號
    protected string $tableName = 'installations';
    protected string $numberField = 'installation_number';
    protected string $cachePrefix = 'installation_number';
}