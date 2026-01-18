# 菜單套餐雲端同步設定指南

## 概述

您的健身菜單套餐現在支援 **雲端同步** 功能！數據會同時儲存在：

1. ✅ **Google Sheets** - 雲端永久儲存，可跨裝置同步
2. ✅ **LocalStorage** - 本地備份，離線也能使用

## 📋 設定步驟

### 第一步：在 Google Sheet 中新增工作表

1. 打開您現有的 Google Sheet（已用於儲存訓練記錄的那個）
2. 點擊底部的 **+** 號新增一個工作表
3. 將新工作表命名為 `WorkoutPackages`
4. 在第一列（標題列）輸入以下欄位：

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| id | name | description | items | type | createdAt |

### 第二步：更新 Google Apps Script

1. 在 Google Sheet 中，點擊「擴充功能」→「Apps Script」
2. 打開專案根目錄的 `google-apps-script-menu-extension.js` 檔案
3. 將檔案內容複製並**整合**到您現有的 Apps Script 中

**重要提醒**：

- 不要刪除原有程式碼
- 只需要將新功能（`getWorkoutPackages`、`saveWorkoutPackages`、`deleteWorkoutPackage`）加入
- 更新 `doGet` 和 `doPost` 函數以支援新的 `action` 參數

完整整合後的程式碼應該像這樣：

```javascript
const SHEET_ID = "YOUR_SHEET_ID";
const SHEET_NAME = "Records";
const PACKAGES_SHEET_NAME = "WorkoutPackages"; // 新增這一行
const ALLOW_EMAILS = ["your-email@gmail.com"];
const TOKEN = "your-secret-token-123";

function doGet(e) {
  try {
    const auth = authorize(e);
    if (!auth.ok) return auth.response;
    
    const action = e.parameter.action || "logs";
    
    // 原有的 logs 功能
    if (action === "logs") {
      // ... 原有程式碼 ...
    }
    
    // 新增：讀取菜單套餐
    if (action === "packages") {
      return getWorkoutPackages();
    }
    
    return json({ error: "unknown action" });
  } catch (error) {
    return json({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    const auth = authorize(e);
    if (!auth.ok) return auth.response;
    
    const action = e.parameter.action || "logs";
    
    // 原有的 logs 功能
    if (action === "logs") {
      // ... 原有程式碼 ...
    }
    
    // 新增：儲存菜單套餐
    if (action === "packages") {
      return saveWorkoutPackages(e);
    }
    
    // 新增：刪除菜單套餐
    if (action === "delete-package") {
      return deleteWorkoutPackage(e);
    }
    
    return json({ error: "unknown action" });
  } catch (error) {
    return json({ error: error.toString() });
  }
}

// ... 然後加入 getWorkoutPackages、saveWorkoutPackages、deleteWorkoutPackage 函數 ...
```

### 第三步：重新部署 Apps Script

1. 點擊「部署」→「管理部署」
2. 點擊現有部署旁的「編輯」（鉛筆圖示）
3. **版本**：選擇「新版本」
4. 點擊「部署」
5. 確認部署成功

### 第四步：測試

1. 啟動開發伺服器：`npm run dev`
2. 在「訓練套餐」區域，您會看到右上角的同步狀態：
   - 🔄 **同步中...** - 正在與 Google Sheets 同步
   - ✅ **已同步** - 成功同步到雲端
   - ⚠️ **同步失敗** - 無法連接到 Google Sheets（仍會使用本地儲存）
3. 嘗試建立一個新的自訂套餐
4. 檢查 Google Sheet 的 `WorkoutPackages` 工作表，應該會看到新資料

## 🔍 如何驗證同步成功

### 方法 1：檢查 Google Sheet

打開 Google Sheet 的 `WorkoutPackages` 工作表，應該能看到您建立的套餐資料。

### 方法 2：跨裝置測試

1. 在電腦 A 建立一個套餐
2. 在電腦 B 或手機打開同一個應用（使用相同的 Google Apps Script URL）
3. 重新整理頁面，應該能看到在電腦 A 建立的套餐

### 方法 3：查看開發者工具

打開瀏覽器的開發者工具（F12）→ Console 標籤，搜尋：

- `"Successfully synced"` - 表示同步成功
- `"Failed to sync"` - 表示同步失敗（會顯示錯誤訊息）

## 📊 儲存機制說明

### 自動同步

- 當您建立、編輯或刪除套餐時，系統會**自動**同步到 Google Sheets
- 使用 1 秒的 debounce，避免過於頻繁的 API 請求
- 同步狀態會即時顯示在 UI 上

### 備援機制

如果 Google Sheets 連線失敗：

- ✅ 數據仍會儲存到 LocalStorage
- ✅ 您可以繼續正常使用應用
- ⚠️ 但無法跨裝置同步

### 資料載入優先順序

1. 優先從 Google Sheets 載入（雲端最新資料）
2. 如果連線失敗，使用 LocalStorage（本地備份）
3. 兩者都沒有，則顯示空列表

## 🚨 常見問題排解

### Q: 顯示「同步失敗」怎麼辦？

**A:** 可能的原因和解決方法：

1. **Google Apps Script URL 未設定**
   - 檢查 `.env.local` 中的 `VITE_APP_SCRIPT_URL`
2. **Token 不正確**
   - 確認 `.env.local` 的 `VITE_APP_TOKEN` 與 Apps Script 中的 `TOKEN` 一致
3. **Apps Script 未重新部署**
   - 更新程式碼後，記得選「新版本」並重新部署
4. **工作表名稱錯誤**
   - 確認 Google Sheet 中的工作表名稱是 `WorkoutPackages`（區分大小寫）

### Q: 資料會不會遺失？

**A:** 不會！系統採用雙重儲存：

- 即使 Google Sheets 同步失敗，資料仍會儲存在瀏覽器的 LocalStorage
- 建議定期備份 Google Sheet

### Q: 可以只使用 LocalStorage，不用 Google Sheets 嗎？

**A:** 可以！如果您沒有設定 `VITE_APP_SCRIPT_URL`：

- 系統會自動回退到純 LocalStorage 模式
- 同步狀態會顯示為「同步失敗」，這是正常的
- 資料仍會正常儲存在本地

### Q: 多人共用同一個 Google Sheet 會衝突嗎？

**A:** 不建議多人同時編輯相同的套餐：

- 目前的設計是「最後寫入者獲勝」
- 如需多人協作，建議每個人使用不同的 Google Sheet

## 🎯 建議設定

### 部署到 GitHub Pages

如果您的應用部署在 GitHub Pages：

1. ✅ **必須**設定 Google Apps Script URL（才能跨裝置同步）
2. ✅ 使用環境變數儲存敏感資訊
3. ⚠️ 不要將 `.env.local` 檔案提交到 Git

### 本地開發

如果只在本機開發：

- 可以不設定 Google Apps Script
- 資料會儲存在 LocalStorage
- 清除瀏覽器資料會遺失

## 📝 資料格式

Google Sheet 中的 `items` 欄位是 JSON 格式，範例：

```json
[
  { "action": "槓鈴深蹲", "sets": 4, "reps": "8-12", "weight": "80" },
  { "action": "保加利亞分體蹲", "sets": 3, "reps": "10", "weight": "16" }
]
```

## 🔐 安全性建議

1. **不要公開分享您的 Apps Script URL**
2. **使用強密碼作為 TOKEN**
3. **定期更換 TOKEN**
4. **只將應用分享給信任的人**

---

如有任何問題，請查看開發者工具的 Console 標籤以獲取更多錯誤訊息。
