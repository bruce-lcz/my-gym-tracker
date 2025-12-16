# 安全性說明

## 🔒 已保護的敏感資訊

以下資訊**不會**上傳到 GitHub：

1. ✅ `.env.local` - 包含 Apps Script URL 和 Token
2. ✅ `SHEET_SETUP.md` - 包含你的 Sheet ID 和 Email
3. ✅ `node_modules/` - 依賴套件
4. ✅ `dist/` - 編譯後的檔案

## 🛡️ 安全建議

### 1. 啟用 Token 驗證（重要！）

在 Apps Script 中設定：
```javascript
const TOKEN = "your-secret-token-123"; // 改成一個複雜的密碼
```

在 `.env.local` 中填入相同 token：
```
VITE_APP_TOKEN=your-secret-token-123
```

### 2. GitHub Secrets 設定

部署到 GitHub Pages 時，需要在 Repository 設定 Secrets：

1. 進入 GitHub Repository
2. Settings → Secrets and variables → Actions
3. 新增以下 Secrets：
   - `VITE_APP_SCRIPT_URL`: 你的 Apps Script URL
   - `VITE_APP_TOKEN`: 你的 Token

### 3. Apps Script 權限設定

建議設定：
- **執行身分**：我
- **誰可以存取**：僅限我自己
- **ALLOW_EMAILS**：填入你的 Gmail（白名單）
- **TOKEN**：設定一個複雜密碼

## ⚠️ 注意事項

- 編譯後的 JS 檔案會包含 Apps Script URL 和 Token
- 但只要 Apps Script 有設定白名單和 Token，別人無法濫用
- 定期更換 Token 以提高安全性
- 不要在公開場合分享 `.env.local` 內容

## 🔄 如何更換 Token

1. 修改 Apps Script 的 `TOKEN` 值
2. 重新部署 Apps Script（新版本）
3. 更新 `.env.local` 的 `VITE_APP_TOKEN`
4. 更新 GitHub Secrets 的 `VITE_APP_TOKEN`
5. 重新部署網站

