# My Gym Tracker (React + Vite + Google Sheets)

前端：React + Vite + TypeScript，可部署 GitHub Pages。  
後端：Google Apps Script Web App，直接讀寫指定 Google Sheet。  
驗證：Apps Script 以 email 白名單驗證（Session.getActiveUser().getEmail()）。

## ✨ 主要功能

- 📝 **新增訓練**：記錄健身動作、組數、重量、RPE 等詳細資訊
- 📊 **訓練紀錄**：查看所有歷史訓練記錄
- 📖 **版本紀錄**：管理應用版本更新和變更日誌
- 🎨 **深色模式**：支援淺色/深色主題切換
- 🎯 **自訂動作**：可新增自己的健身動作
- 📱 **響應式設計**：支援手機、平板、桌面各種螢幕尺寸
- 🎭 **豐富圖標**：使用 Lucide React 提供美觀的圖標系統

## 環境設定
1. 建立 `.env.local`，填入：
   ```
   VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/你的-script-id/exec
   VITE_APP_TOKEN=你的自訂 token（若不用可留空）
   ```
2. 安裝依賴並啟動
   ```bash
   npm install
   npm run dev
   ```

## Google Apps Script 範例
```js
const SHEET_ID = "YOUR_SHEET_ID"; // 改成你的 Google Sheet ID
const SHEET_NAME = "工作表1"; // 改成你的工作表標籤名稱
const ALLOW_EMAILS = ["your-email@gmail.com"]; // 改成你的 Gmail
const TOKEN = "your-secret-token-123"; // 設定一個密碼，前端 .env 也要填相同的

function doGet(e) {
  const auth = authorize(e);
  if (!auth.ok) return auth.response;
  const action = e.parameter.action || "logs";
  if (action !== "logs") return json({ error: "unknown action" });

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  const [header, ...rows] = values;
  const data = rows
    .filter(r => r.length && r.some(v => v !== ""))
    .map(r => {
      const obj = {};
      header.forEach((key, idx) => (obj[key] = r[idx]));
      return obj;
    });

  return json(data);
}

function doPost(e) {
  const auth = authorize(e);
  if (!auth.ok) return auth.response;
  const action = e.parameter.action || "logs";
  if (action !== "logs") return json({ error: "unknown action" });
  const body = JSON.parse(e.postData.contents || "{}");

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  sheet.appendRow([
    body.actionZh ?? body["動作名稱 (中文)"] ?? "",
    body.actionEn ?? body["動作名稱 (英文)"] ?? "",
    body.targetMuscle ?? body["目標肌群"] ?? "",
    body.lastDate ?? body["上次日期"] ?? "",
    body.lastRecord ?? body["上次紀錄 (Max Weight/Reps)"] ?? "",
    body.currentDate ?? body["本次日期"] ?? "",
    body.set1 ?? body["Set 1 (Reps @ Weight kg)"] ?? "",
    body.set2 ?? body["Set 2 (Reps @ Weight kg)"] ?? "",
    body.set3 ?? body["Set 3 (Reps @ Weight kg)"] ?? "",
    body.rpe ?? body["RPE (強度感受)"] ?? "",
    body.nextTarget ?? body["下次目標 (Target)"] ?? "",
    new Date()
  ]);

  return json({ message: "ok" });
}

function authorize(e) {
  const email = Session.getActiveUser().getEmail();
  if (ALLOW_EMAILS.length && !ALLOW_EMAILS.includes(email)) {
    return { ok: false, response: json({ error: "not allowed" }) };
  }
  if (TOKEN && e.parameter.token !== TOKEN) {
    return { ok: false, response: json({ error: "invalid token" }) };
  }
  return { ok: true };
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

### Apps Script 部署步驟
1. 在 Google Sheet 內「擴充功能」→「Apps Script」，貼上程式碼，調整 `SHEET_NAME`、`ALLOW_EMAILS`、`TOKEN`。
2. 「部署」→「新部署」→ 類型選「網頁應用程式」，執行身份：自己，存取權：僅限自己/具權限帳號。
3. 複製部署後的 Web App URL，填入前端 `.env.local` 的 `VITE_APP_SCRIPT_URL`。

### GitHub Pages 部署
1. `npm run build`
2. 將 `dist/` 推到 GitHub（根據你的專案路徑，`vite.config.ts` 的 `base` 預設為 `./`）。
3. GitHub Repo 設定 Pages，來源選 `gh-pages` 分支或 `dist` 輸出（可用 GitHub Actions 部署）。

### 常見問題
- CORS：Apps Script 回應需加 `Access-Control-Allow-Origin`。若仍被擋，檢查部署版本是否最新並重新發佈。
- 權限：若設「僅限自己」，請用同一帳號登入 Google 後再呼叫 API。
- 欄位對應：前端 `TrainingLog` 與 Sheet 欄位一致；可在 Apps Script `appendRow` 調整順序或增加欄位。

