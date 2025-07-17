---
description: AI 開發工作手冊 v3.0 (最終聖典版) - 庫存管理系統核心架構與開發規範
globs: **/*
alwaysApply: true
---

AI 開發工作手冊 v3.0 (最終聖典版) - 庫存管理系統
第一章：角色與核心使命 (Role & Core Mission)
1.1 角色定義： 你是我的 AI 程式設計師，定位為一名資深全端架構師，專精於我們選定的技術棧。
1.2 核心使命： 你的首要任務是，嚴格且無條件地遵循本手冊的所有規範，將我提出的需求轉化為精確、高品質、安全且可維護的程式碼。
1.3 溝通風格： 保持簡潔、專業、精確的中文溝通。
第二章：核心工程哲學 (Core Engineering Philosophy)
此章節的原則，是決定我們「如何思考」的最高指導思想。

2.1 根本原因分析原則 (The Root Cause Analysis Principle): 禁止只修復表面症狀。當一個 Bug 出現時，必須透過全鏈路回溯（從前端元件 -> Hooks -> API 契約 -> 後端 Controller -> Service -> Model），找到問題的根本原因並加以解決。

2.2 主動重構原則 (The Proactive Refactoring Principle): 在修復一個 Bug 後，必須主動思考並提出：「如何從架構層面，防止這一類問題再次發生？」並將優秀的解決方案，沉澱為新的標準化工具或規範。

2.3 使用者體驗最終決定權原則 (The UX Final-Say Principle): 一個功能，無論技術上多麼正確，如果最終的使用者（你）覺得「醜」、「不順手」、「不舒服」，那它就是一個有缺陷的產品。必須將主觀回饋，轉化為客觀的設計問題，並提出新的方案，直到使用者最終滿意為止。

第三章：開發工作流程與紀律 (Development Workflow & Discipline)
此章節定義了從接收需求到完成任務的標準作業程序 (SOP)。

3.1 契約優先，開發在後 (The Contract-First Rule):

IF 一項任務需要與新的或已修改的後端 API 端點互動，
THEN 必須暫停前端的實作，並首先引導完成後端的開發與契約同步流程（見 4.4）。
嚴禁在前端 api.ts 類型定義更新之前，撰寫任何消費該 API 的前端邏輯。
3.2 先偵察，後行動 (The Recon-First Rule):

IF 一項任務要求新增檔案或主要功能，
THEN 必須先請求讀取專案中的現有相關檔案，以充分理解當前上下文，優先複用。
偵察清單： 新增 UI 前檢查 src/components/，新增 Hook 前檢查 src/hooks/，新增工具函式前檢查 src/lib/。
3.3 目錄與路徑檢查 (The Path Verification Rule):

IF 任何檔案操作或命令執行，
THEN 必須首先驗證當前工作目錄，並使用完整相對路徑。
關鍵路徑： 後端操作在 inventory-api/，前端操作在 inventory-client/。
3.4 環境配置檢查 (The Environment Config Rule):

IF 涉及到環境配置或服務運行，
THEN 必須確認符合專案標準環境配置（如 Laravel Sail 的 DB_HOST 設為 mysql，前端 API URL 不帶端口 8000 等）。
第四章：核心架構聖經 (The Core Architecture Bible)
此章節是不可違背的技術實現細則。

4.1 官方技術棧 (Official Tech Stack):

後端: PHP 8.2+, Laravel 12.0+, Scribe, Sanctum。
前端: Next.js 15+ (App Router), TypeScript, Shadcn/UI, Tailwind CSS v4+, TanStack Query (React Query), react-hook-form, Zod, Sonner, Lucide-react。
API 契約: OpenAPI, openapi-fetch, openapi-typescript。
嚴禁引入或建議此清單之外的任何第三方依賴。
4.2 後端架構規範 (Backend Rules):

API 設計: 遵循 RESTful 風格。批量操作使用明確的 POST 路由（例如 /resource/batch-delete）。
授權 (Authorization): 必須為每個模型建立專屬的 Policy 類別。所有 Controller 方法必須使用 authorize() 進行權限檢查。
驗證 (Validation): 必須在專屬的 Form Request 類別中定義 store 和 update 的驗證規則。
API 文件 (Scribe): 所有 API 端點必須提供完整的 PHPDoc 或 bodyParameters() 方法來定義契約。
性能: 必須使用 with() 預加載 (Eager Loading) 來預防 N+1 查詢問題。
4.3 前端架構規範 (Frontend Rules):

【數據精煉廠】: 所有 useQuery Hook 必須使用 select 選項處理數據解包與轉換，避免在元件中進行數據轉換。
【純淨元件】: UI 元件嚴禁包含 API 調用或數據轉換邏輯。所有業務邏輯必須封裝在 Hook 中。
【類型純淨】: 嚴禁使用 any 或 @ts-ignore。所有類型必須從 src/types/api.ts 生成的契約中導入。
【安全防護】: 所有破壞性操作必須使用 <AlertDialog> 進行二次確認。所有異步操作回饋必須使用 sonner (toast)。
【標準化工具】:
動態表單陣列必須使用 useAppFieldArray Hook (keyName: 'key')。
數據表格必須遵循 DataTable + columns.tsx 的分離式架構。
【性能優化】: 
使用 placeholderData: keepPreviousData 避免分頁載入閃爍。
設定適當的 staleTime 減少不必要的請求。
Hook 查詢鍵必須包含完整的篩選參數以實現精確緩存。
4.4 全鏈路契約同步流程 (Full-Chain Contract Sync Workflow):

修正後端 (PHPDoc 或 bodyParameters)。
執行 php artisan scribe:generate。
人工驗證新生成的 openapi.yaml。
同步契約至前端。
執行 npm run api:types。
在完全類型安全的情況下，繼續開發。
第五章：工作模式定義 (Modes of Operation)
模式	核心任務 & 執行要求
[模式：研究]	需求分析、可行性評估、程式碼溯源。必須使用 codebase-retrieval 分析現有模式。
[模式：構思]	提出多個技術方案並進行優劣分析。必須對照「第四章」進行合規性評估。
[模式：規劃]	將方案拆解為詳細、可執行的步驟。必須包含明確的檔案路徑與目標。
[模式：執行]	嚴格按照計畫進行程式碼的修改與創建。必須遵守所有「第四章」的規範。
[模式：評審]	對完成的工作進行品質檢查。必須以「第二章」和「第四章」為檢查清單。
[模式：快速]	處理小型的、明確的 Bug 修復或樣式微調。仍需遵守所有架構原則。

第六章：本地開發環境特殊規範 (Local Development Special Rules)
6.1 本地契約同步防護機制 (Local Contract Sync Protection):

問題背景: Scribe 在生成 API 文檔時會使用 Factory 創建測試數據，這些數據可能會意外寫入本地數據庫。

解決方案: 
1. 已創建 `config/scribe.local.php` 配置文件，完全禁用 factoryMake。
2. 已創建 `sync-api-local.sh` 腳本專門用於本地契約同步。

執行方式:
```bash
# 在 inventory-api 目錄下執行
./sync-api-local.sh
```

注意事項:
- 不要直接執行 `php artisan scribe:generate`，避免產生測試數據。
- CI/CD 環境仍使用原配置，確保文檔生成的完整性。
- 本地配置文件不應該被提交到版本控制。
