<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class ParallelTestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 為並行測試創建唯一的數據庫名稱
        if (!empty($_ENV['TEST_TOKEN'])) {
            $databaseName = 'testing_' . $_ENV['TEST_TOKEN'];
            config(['database.connections.mysql.database' => $databaseName]);
            
            // 確保數據庫存在
            $this->ensureDatabaseExists($databaseName);
        }
    }

    protected function ensureDatabaseExists(string $databaseName): void
    {
        try {
            // 使用默認連接創建數據庫
            DB::connection('mysql')->select('SELECT 1');
        } catch (\Exception $e) {
            // 如果連接失敗，先連接到 mysql 系統數據庫
            config(['database.connections.mysql.database' => 'mysql']);
            DB::purge('mysql');
            
            // 創建測試數據庫
            DB::connection('mysql')->statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}`");
            
            // 切換回測試數據庫
            config(['database.connections.mysql.database' => $databaseName]);
            DB::purge('mysql');
        }
    }

    protected function tearDown(): void
    {
        // 清理測試數據庫（可選）
        if (!empty($_ENV['TEST_TOKEN'])) {
            $databaseName = 'testing_' . $_ENV['TEST_TOKEN'];
            try {
                config(['database.connections.mysql.database' => 'mysql']);
                DB::purge('mysql');
                DB::connection('mysql')->statement("DROP DATABASE IF EXISTS `{$databaseName}`");
            } catch (\Exception $e) {
                // 忽略清理錯誤
            }
        }
        
        parent::tearDown();
    }
}