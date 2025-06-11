# 安全性配置指南

## 🔒 認證和授權

### Token 管理
- 目前使用 localStorage 存儲 JWT token
- **生產環境建議**: 考慮使用 httpOnly cookies 提高安全性
- Token 自動過期處理已實現

### 路由保護
- 使用 `withAuth` HOC 保護頁面組件
- Middleware 提供基礎路由檢查
- 客戶端進行完整認證驗證

## 🌐 API 安全

### 環境變數
- 所有 API 端點通過環境變數配置
- 生產環境必須設置 `NEXT_PUBLIC_API_BASE_URL`
- 不要在代碼中硬編碼敏感信息

### 請求安全
- 自動在請求頭添加 Bearer Token
- 統一的錯誤處理和重試機制
- 類型安全的 API 調用

## 🛡️ 部署安全檢查清單

### 環境變數檢查
- [ ] 設置正確的 `NEXT_PUBLIC_API_BASE_URL`
- [ ] 確保生產環境不使用開發用 URL
- [ ] 檢查所有環境變數是否正確配置

### HTTPS 配置
- [ ] 生產環境必須使用 HTTPS
- [ ] 配置正確的 CORS 設置
- [ ] 設置適當的 CSP (Content Security Policy)

### Token 安全
- [ ] 考慮實現 token 刷新機制
- [ ] 設置適當的 token 過期時間
- [ ] 實現安全的登出流程

## 🚨 已知風險和緩解措施

### XSS 防護
- React 自動轉義輸出，降低 XSS 風險
- 避免使用 `dangerouslySetInnerHTML`
- 驗證所有用戶輸入

### CSRF 防護
- API 使用 Bearer Token 而非 Cookies
- 考慮添加 CSRF token 驗證

### 資料洩露防護
- 敏感資料不記錄在 console.log
- 生產環境關閉詳細錯誤訊息
- 實現適當的權限控制

## 📋 安全更新建議

1. **即將實施**:
   - 將 token 存儲改為 httpOnly cookies
   - 實現 refresh token 機制
   - 添加請求速率限制

2. **長期目標**:
   - 實現多因素認證 (MFA)
   - 添加登入異常檢測
   - 實現會話管理功能 