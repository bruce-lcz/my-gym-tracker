# Token 驗證設定指南

## 📋 概述
已為 AppScript 加入 Token 驗證功能，提升安全性。

## 🔧 設定步驟

### 1. 更新 Apps Script 程式碼
1. 開啟你的 Google Sheet
2. 點擊 **Extensions > Apps Script**
3. 將 `docs/AppScript_v2.gs` 的完整內容複製貼上（覆蓋舊的）
4. **儲存** (Ctrl+S)

### 2. 設定 Script Properties (重要！)
1. 在 Apps Script 編輯器中，點擊左側的 **⚙️ Project Settings**（齒輪圖示）
2. 往下滾動到 **Script Properties** 區塊
3. 點擊 **Add script property**
4. 填入以下資訊：
   - **Property**: `AUTH_TOKEN`
   - **Value**: `your-secret-token-123` (必須與 `.env.local` 中的 `VITE_APP_TOKEN` 一致)
5. 點擊 **Save script properties**

### 3. 重新部署 (如果需要)
如果你是第一次部署或需要更新：
1. 點擊右上角 **Deploy > New deployment**
2. 選擇 **Web app**
3. 設定：
   - Execute as: **Me**
   - Who has access: **Anyone**
4. 點擊 **Deploy**
5. 複製新的 URL 到 `.env.local` 的 `VITE_APP_SCRIPT_URL`

**或者**，如果已經有部署：
1. 點擊 **Deploy > Manage deployments**
2. 點擊現有部署旁的 **✏️ Edit**
3. 選擇 **New version**
4. 點擊 **Deploy**
5. URL 通常會保持不變

### 4. 驗證設定
1. 確認 `.env.local` 包含：
   ```
   VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   VITE_APP_TOKEN=your-secret-token-123
   ```
2. 重新啟動開發伺服器：`npm run dev`
3. 測試新增一筆訓練紀錄

## ⚠️ 注意事項
- **Token 必須完全一致**：`.env.local` 的 `VITE_APP_TOKEN` 和 Script Properties 的 `AUTH_TOKEN` 必須相同
- **不要分享 Token**：這是你的私密金鑰
- 如果看到 "Invalid token" 錯誤，請檢查兩邊的 token 是否一致

## 🔒 安全性提升
- ✅ 只有知道正確 token 的人才能存取你的資料
- ✅ 即使有人知道你的 Apps Script URL，沒有 token 也無法讀取或寫入資料
- ✅ Token 儲存在 Script Properties 中，不會出現在程式碼裡
