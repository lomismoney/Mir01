<?php

namespace Database\Migrations\Helpers;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;

class DatabaseHelper
{
    /**
     * 檢查當前資料庫驅動類型
     */
    public static function isMySQL(): bool
    {
        return DB::getDriverName() === 'mysql';
    }

    /**
     * 檢查當前資料庫驅動類型
     */
    public static function isSQLite(): bool
    {
        return DB::getDriverName() === 'sqlite';
    }

    /**
     * 根據資料庫類型添加FULLTEXT索引
     */
    public static function addFulltextIndex(Blueprint $table, string $indexName, array $columns): void
    {
        if (self::isMySQL()) {
            // MySQL: 使用FULLTEXT索引
            DB::statement("ALTER TABLE {$table->getTable()} ADD FULLTEXT {$indexName} (" . implode(',', $columns) . ")");
        } elseif (self::isSQLite()) {
            // SQLite: 使用普通索引（測試環境中通常足夠）
            $table->index($columns, $indexName);
        }
    }

    /**
     * 根據資料庫類型添加ENUM約束
     */
    public static function addEnumConstraint(Blueprint $table, string $column, array $values, string $default = null): void
    {
        if (self::isMySQL()) {
            // MySQL: 使用原生ENUM
            $enumValues = "'" . implode("','", $values) . "'";
            $columnDef = "ENUM({$enumValues})";
            if ($default) {
                $columnDef .= " DEFAULT '{$default}'";
            }
            DB::statement("ALTER TABLE {$table->getTable()} MODIFY {$column} {$columnDef}");
        } elseif (self::isSQLite()) {
            // SQLite: 使用CHECK約束
            $checkValues = "'" . implode("' OR {$column} = '", $values) . "'";
            DB::statement("ALTER TABLE {$table->getTable()} ADD CONSTRAINT check_{$column}_enum CHECK ({$column} = {$checkValues})");
            
            if ($default) {
                DB::statement("ALTER TABLE {$table->getTable()} ALTER COLUMN {$column} SET DEFAULT '{$default}'");
            }
        }
    }

    /**
     * 根據資料庫類型添加計算欄位
     */
    public static function addComputedColumn(Blueprint $table, string $column, string $expression, string $type = 'BIGINT'): void
    {
        $tableName = $table->getTable();
        
        if (self::isMySQL()) {
            // MySQL: 使用GENERATED COLUMN
            DB::statement("ALTER TABLE {$tableName} ADD COLUMN {$column} {$type} AS ({$expression}) STORED");
        } elseif (self::isSQLite()) {
            // SQLite: 使用普通欄位 + 觸發器
            DB::statement("ALTER TABLE {$tableName} ADD COLUMN {$column} {$type}");
            
            // 創建觸發器來維護計算欄位
            $triggerName = "update_{$tableName}_{$column}";
            DB::statement("
                CREATE TRIGGER {$triggerName}_insert 
                AFTER INSERT ON {$tableName}
                BEGIN 
                    UPDATE {$tableName} SET {$column} = {$expression} WHERE rowid = NEW.rowid;
                END
            ");
            
            DB::statement("
                CREATE TRIGGER {$triggerName}_update 
                AFTER UPDATE ON {$tableName}
                BEGIN 
                    UPDATE {$tableName} SET {$column} = {$expression} WHERE rowid = NEW.rowid;
                END
            ");
        }
    }

    /**
     * 檢查索引是否存在（跨資料庫相容）
     */
    public static function indexExists(string $table, string $indexName): bool
    {
        if (self::isMySQL()) {
            $result = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
            return !empty($result);
        } elseif (self::isSQLite()) {
            $result = DB::select("SELECT name FROM sqlite_master WHERE type='index' AND name = ?", [$indexName]);
            return !empty($result);
        }
        
        return false;
    }

    /**
     * 安全地刪除索引（跨資料庫相容）
     */
    public static function dropIndexIfExists(string $table, string $indexName): void
    {
        if (self::indexExists($table, $indexName)) {
            if (self::isMySQL()) {
                DB::statement("DROP INDEX {$indexName} ON {$table}");
            } elseif (self::isSQLite()) {
                DB::statement("DROP INDEX IF EXISTS {$indexName}");
            }
        }
    }

    /**
     * 縮短索引名稱以符合SQLite限制
     */
    public static function getSafeIndexName(string $originalName): string
    {
        if (self::isSQLite() && strlen($originalName) > 64) {
            // 為SQLite創建縮短的索引名稱
            return 'idx_' . substr(md5($originalName), 0, 58);
        }
        
        return $originalName;
    }
}