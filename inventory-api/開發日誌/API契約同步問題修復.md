# API 契約同步問題修復

## 問題描述

安裝管理相關的多個 API 呼叫錯誤地傳遞了多餘的路徑參數。API 路由只期望單一的 ID 參數（如 `{id}` 或 `{installation_id}`），但程式碼卻同時傳遞了期望的參數和額外的 `installation` 參數，這可能導致 API 呼叫失敗。

### 受影響的路由

1. `GET /api/installations/{id}` - 生成的類型期望 `id` 和 `installation` 兩個參數
2. `PUT /api/installations/{id}` - 生成的類型期望 `id` 和 `installation` 兩個參數
3. `DELETE /api/installations/{id}` - 生成的類型期望 `id` 和 `installation` 兩個參數
4. `POST /api/installations/{installation_id}/assign` - 生成的類型期望 `installation_id` 和 `installation` 兩個參數
5. `POST /api/installations/{installation_id}/status` - 生成的類型期望 `installation_id` 和 `installation` 兩個參數

## 根本原因

問題出在 Laravel Scribe 文檔生成工具的行為上。當控制器方法中同時出現：
1. PHPDoc 的 `@urlParam` 註解
2. 路由模型綁定（如 `Installation $installation`）

Scribe 會從兩個來源提取參數信息，導致生成重複的參數定義。

### 錯誤示例

```php
/**
 * 查看安裝單詳情
 * 
 * @urlParam installation integer required 安裝單ID。Example: 1
 */
public function show(Request $request, Installation $installation)
{
    // ...
}
```

這會導致 Scribe 生成兩個參數：
- 從 `@urlParam` 註解獲得的 `installation` 參數
- 從路由綁定推斷的 `id` 參數（因為路由定義是 `{installation}`）

## 解決方案

移除控制器中所有的 `@urlParam` 註解，讓 Scribe 從路由定義和方法簽名自動推斷參數信息。

### 修正步驟

1. **移除 PHPDoc 中的 @urlParam 註解**
   ```php
   /**
    * 查看安裝單詳情
    * 
    * @queryParam include 包含關聯資源。可選值：items,order,installer,creator。Example: items,order
    */
   public function show(Request $request, Installation $installation)
   {
       // ...
   }
   ```

2. **重新生成 API 文檔**
   ```bash
   ./vendor/bin/sail artisan scribe:generate
   ```

3. **同步到前端**
   ```bash
   cp inventory-api/storage/app/private/scribe/openapi.yaml inventory-client/openapi.yaml
   cd inventory-client && npm run api:types
   ```

4. **移除前端的 `as any` 類型斷言**
   ```typescript
   // 修改前
   params: { path: { id } as any }
   
   // 修改後
   params: { path: { id } }
   ```

## 驗證結果

修正後的 OpenAPI 定義：
- `/api/installations/{id}` - 只有一個參數 `id`
- `/api/installations/{installation_id}/assign` - 只有一個參數 `installation_id`
- `/api/installations/{installation_id}/status` - 只有一個參數 `installation_id`

## 最佳實踐

1. **避免在 PHPDoc 中使用 @urlParam**：讓 Scribe 從路由和方法簽名自動推斷參數
2. **使用一致的參數命名**：確保路由參數名稱與方法參數名稱一致
3. **定期同步 API 契約**：在修改後端 API 後，立即重新生成文檔並同步到前端
4. **避免使用 `as any`**：維持嚴格的類型檢查，確保 API 契約的正確性

## 相關文件

- [Scribe 官方文檔](https://scribe.knuckles.wtf/)
- [Laravel 路由模型綁定](https://laravel.com/docs/11.x/routing#route-model-binding) 