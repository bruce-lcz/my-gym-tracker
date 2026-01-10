# 安全性說明

## 🔒 已保護的敏感資訊

以下資訊**不會**上傳到 GitHub：

1. ✅ `.env.local` - 包含 Apps Script URL、Token 和存取密碼
2. ✅ `SHEET_SETUP.md` - 包含你的 Sheet ID 和 Email
3. ✅ `node_modules/` - 依賴套件
4. ✅ `dist/` - 編譯後的檔案

## 🛡️ 安全建議

### 1. 前端密碼驗證（重要！）

**兩層保護機制**：

**第一層 - 前端登入密碼**：
在 `.env.local` 中設定存取密碼：
```
VITE_ACCESS_PASSWORD=your-strong-password-here
```

使用者必須輸入正確的密碼才能進入應用程式。這可以阻擋大部分的未授權訪問。

**第二層 - 後端 Token 驗證**：
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
   - `VITE_ACCESS_PASSWORD`: 你的前端存取密碼

### 3. Apps Script 權限設定

建議設定：
- **執行身分**：我
- **誰可以存取**：僅限我自己
- **ALLOW_EMAILS**：填入你的 Gmail（白名單）
- **TOKEN**：設定一個複雜密碼

## ⚠️ 注意事項

### 關於前端密碼安全性

- ⚠️ **編譯後的 JS 檔案會包含密碼**：前端密碼會被編譯進 JavaScript，技術上有心人仍可從原始碼中找到
- ✅ **足以阻擋一般訪客**：對於 99% 的未授權訪問已經足夠
- ✅ **兩層保護更安全**：即使前端密碼被繞過，後端 Token 和 Email 白名單仍會阻止濫用
- 🔐 **更高安全性方案**：如需軍事級安全，應考慮使用真正的後端服務（如 Firebase Authentication）

### 其他安全提醒

- 定期更換密碼和 Token 以提高安全性
- 不要在公開場合分享 `.env.local` 內容
- Apps Script 的白名單和 Token 是最後一道防線

## 🔄 如何更換密碼和 Token

### 更換前端存取密碼

1. 更新 `.env.local` 的 `VITE_ACCESS_PASSWORD`
2. 更新 GitHub Secrets 的 `VITE_ACCESS_PASSWORD`
3. 重新部署網站

### 更換後端 Token

1. 修改 Apps Script 的 `TOKEN` 值
2. 重新部署 Apps Script（新版本）
3. 更新 `.env.local` 的 `VITE_APP_TOKEN`
4. 更新 GitHub Secrets 的 `VITE_APP_TOKEN`
5. 重新部署網站

