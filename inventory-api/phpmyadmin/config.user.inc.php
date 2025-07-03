<?php
/**
 * phpMyAdmin 自定義配置檔案
 * 
 * 此檔案提供了針對 Laravel Sail 環境的 phpMyAdmin 配置
 * 包含安全性設定、介面優化和繁體中文支援
 */

declare(strict_types=1);

/**
 * 資料庫配置
 */
// 允許連接到任意伺服器（已在環境變數中設定）
$cfg['AllowArbitraryServer'] = true;

/**
 * 安全性設定
 */
// 限制登入嘗試次數
$cfg['LoginCookieValidityDisableWarning'] = true;
$cfg['LoginCookieRecall'] = true;
$cfg['LoginCookieValidity'] = 3600; // 1小時

// 啟用雙因子認證支援
$cfg['Enable2fa'] = true;

/**
 * 介面設定
 */
// 設定預設語言為繁體中文
$cfg['DefaultLang'] = 'zh_TW';

// 設定主題
$cfg['ThemeDefault'] = 'pmahomme';

// 顯示 PHP 資訊連結
$cfg['ShowPhpInfo'] = true;

// 顯示統計資訊
$cfg['ShowStats'] = true;

// 顯示伺服器資訊
$cfg['ShowServerInfo'] = true;

/**
 * 匯入/匯出設定
 */
// 增加檔案上傳限制
$cfg['UploadDir'] = '/tmp/phpmyadmin/upload';
$cfg['SaveDir'] = '/tmp/phpmyadmin/save';

// CSV 匯出設定
$cfg['Export']['csv_columns'] = true;
$cfg['Export']['csv_structure_or_data'] = 'data';
$cfg['Export']['csv_null'] = 'NULL';

// SQL 匯出設定
$cfg['Export']['sql_structure_or_data'] = 'structure_and_data';
$cfg['Export']['sql_create_table'] = true;
$cfg['Export']['sql_if_not_exists'] = true;
$cfg['Export']['sql_auto_increment'] = true;

/**
 * 編輯器設定
 */
// 啟用語法高亮
$cfg['CodemirrorEnable'] = true;

// 顯示行號
$cfg['LineNumbers'] = true;

/**
 * 瀏覽設定
 */
// 每頁顯示記錄數
$cfg['MaxRows'] = 50;

// 排序設定
$cfg['Order'] = 'ASC';

/**
 * SQL 查詢歷史
 */
// 啟用查詢歷史
$cfg['QueryHistoryDB'] = true;
$cfg['QueryHistoryMax'] = 100;

/**
 * 效能監控
 */
// 顯示查詢執行時間
$cfg['ShowSQL'] = true;

/**
 * 表格設定
 */
// 預設表格引擎
$cfg['DefaultTabTable'] = 'tbl_structure.php';

// 顯示註釋
$cfg['ShowTooltip'] = true;
$cfg['ShowTooltipAliasDB'] = false;
$cfg['ShowTooltipAliasTB'] = false;

/**
 * 記憶體和執行時間限制
 */
// 設定記憶體限制（與環境變數保持一致）
$cfg['MemoryLimit'] = '1024M';

// 設定執行時間限制（與環境變數保持一致）
$cfg['ExecTimeLimit'] = 600;

/**
 * 字元集設定
 */
// 強制使用 UTF-8
$cfg['DefaultCharset'] = 'utf8mb4';

/**
 * 時區設定
 */
// 設定為台北時區（與環境變數保持一致）
$cfg['Servers'][1]['SessionTimeZone'] = '+08:00';

/**
 * 錯誤報告設定
 */
// 在開發環境中顯示錯誤
$cfg['SendErrorReports'] = 'never';
$cfg['ShowDisplayDirection'] = false;

/**
 * 版本檢查
 */
// 關閉版本檢查以提高隱私性
$cfg['VersionCheck'] = false; 