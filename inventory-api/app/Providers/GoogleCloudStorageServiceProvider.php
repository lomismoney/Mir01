<?php

namespace App\Providers;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;
use League\Flysystem\GoogleCloudStorage\GoogleCloudStorageAdapter;

/**
 * Google Cloud Storage 服務提供者
 * 
 * 用於註冊 Google Cloud Storage 檔案系統驅動
 * 支援 Laravel 12 + Flysystem v3
 * 
 * @package App\Providers
 */
class GoogleCloudStorageServiceProvider extends ServiceProvider
{
    /**
     * 註冊服務
     *
     * @return void
     */
    public function register(): void
    {
        //
    }

    /**
     * 啟動服務
     *
     * @return void
     */
    public function boot(): void
    {
        Storage::extend('gcs', function ($app, $config) {
            // 建立 Google Cloud Storage 客戶端配置
            $clientConfig = [
                'projectId' => $config['project_id'],
            ];

            // 如果有指定金鑰檔案路徑，則使用它（本地開發）
            if (isset($config['key_file']) && !empty($config['key_file'])) {
                $clientConfig['keyFilePath'] = $config['key_file'];
            }
            // 否則使用服務帳號（GCP Cloud Run 環境）

            // 建立 Storage 客戶端
            $storageClient = new StorageClient($clientConfig);
            $bucket = $storageClient->bucket($config['bucket']);

            // 建立適配器選項
            $options = [];
            if (isset($config['path_prefix'])) {
                $options['prefix'] = $config['path_prefix'];
            }

            // 建立 Google Cloud Storage 適配器
            $adapter = new GoogleCloudStorageAdapter($bucket, $config['path_prefix'] ?? '');

            // 建立 Flysystem 檔案系統
            $filesystem = new Filesystem($adapter);

            // 回傳 Laravel 檔案系統適配器
            return new FilesystemAdapter($filesystem, $adapter, $config);
        });
    }
} 