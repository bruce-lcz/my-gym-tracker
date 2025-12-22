# 技術開發與部署指南

這份文件記錄了 **My Gym Tracker** 的技術架構、環境設定、API 開發以及部署流程，適合想要了解開發細節或自行架設的開發者。

## 🛠 技術架構

- **前端**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **後端**: [Google Apps Script](https://developers.google.com/apps-script) (作為 Serverless API)
- **資料庫**: [Google Sheets](https://www.google.com/sheets/about/) (作為雲端資料存儲)
- **UI 組件**: [Lucide React](https://lucide.dev/) (圖標)、原生 CSS (設計系統)
- **數據可視化**: [Recharts](https://recharts.org/)

## 🚀 環境設定 (Local Development)

### 1. 前端環境
1. 建立 `.env.local` 並填入：
   ```env
   VITE_APP_SCRIPT_URL=https://script.google.com/macros/s/你的-script-id/exec
   VITE_APP_TOKEN=你的自訂 token（用於加強安全驗證）
   ```
2. 啟動開發伺服器
   ```bash
   npm install
   npm run dev
   ```

### 2. Google Apps Script 設定
在 Google Sheet 內「擴充功能」→「Apps Script」，貼上以下程式碼：

```js
const SHEET_ID = "YOUR_SHEET_ID"; // 你的 Google Sheet ID
const SHEET_NAME = "工作表1";     // 工作表名稱
const ALLOW_EMAILS = ["your-email@gmail.com"]; // 授權存取的 Gmail
const TOKEN = "your-secret-token";            // 與前端 .env 相同的 token

function doGet(e) {
  const auth = authorize(e);
  if (!auth.ok) return auth.response;
  
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
  const body = JSON.parse(e.postData.contents || "{}");

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  sheet.appendRow([
    body.actionZh || "",
    body.actionEn || "",
    body.targetMuscle || "",
    body.lastDate || "",
    "", // 可預留欄位
    body.currentDate || "",
    body.set1 || "",
    body.set2 || "",
    body.set3 || "",
    body.rpe || "",
    body.nextTarget || "",
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
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**部署步驟：**
1. 點擊「部署」→「新部署」。
2. 類型選「網頁應用程式」。
3. 執行身份：**自己**。
4. 存取權：**僅限自己** (若配合 `Session.getActiveUser()` 使用) 或 **任何人** (若完全使用 TOKEN 驗證)。
5. 複製 URL 填入前端 `.env.local`。

## 📦 部署 (Deployment)

### GitHub Pages
1. 在 `vite.config.ts` 設定 `base: "./"`。
2. 執行 `npm run build`。
3. 將 `dist/` 資料夾內容部署至 `gh-pages` 分支。
4. 在 Repo 的 Settings -> Pages 中開啟。

## 💡 常見問題與解決方案
- **CORS 問題**: Apps Script Web App 本質上不支援標準 CORS，但透過 `Google Apps Script` 的重定向機制，前端可以正常呼叫。請確保部署版本是最新的。
- **權限驗證**: 建議使用 `Session.getActiveUser().getEmail()` 搭配 `ALLOW_EMAILS` 白名單，這在企業內部或是個人使用時非常安全。
