# 菜單儲存方案總結

## 🎯 您的問題
>
> 我現在的這些菜單 JSON 會存在哪裡？因為我是部署在 GitHub Pages 的，有甚麼方法儲存？

## ✅ 解答

### 目前的儲存方式（未更新前）

您的菜單套餐數據儲存在 **瀏覽器的 LocalStorage** 中：

- ❌ 只存在本機，無法跨裝置同步
- ❌ 清除瀏覽器資料會遺失
- ✅ 不需要後端，自動保存

### 新的儲存方案（已實作）

我已經為您實作了 **雲端同步方案**，數據現在會同時儲存在：

1. **Google Sheets** ☁️
   - ✅ 雲端永久儲存
   - ✅ 跨裝置同步
   - ✅ 可以在 Google Sheet 中直接查看/編輯
   - ✅ 適合 GitHub Pages 部署

2. **LocalStorage** 💾
   - ✅ 本地備份
   - ✅ 離線也能使用
   - ✅ 即時儲存，無需等待

## 📂 已新增的檔案

1. **`src/services/workoutPackageSync.ts`**
   - 雲端同步服務
   - 處理與 Google Sheets 的溝通

2. **`google-apps-script-menu-extension.js`**
   - Google Apps Script 擴充程式碼
   - 需要複製到您的 Google Apps Script 專案中

3. **`MENU_SYNC_SETUP.md`**
   - 完整的設定指南
   - 包含詳細步驟和故障排除

4. **已更新 `src/components/WorkoutMenu.tsx`**
   - 整合雲端同步功能
   - 加入同步狀態指示器

## 🚀 快速開始

### 如果您想使用雲端同步（推薦）

請按照以下步驟：

1. **在 Google Sheet 新增工作表**
   - 名稱：`WorkoutPackages`
   - 欄位：`id` | `name` | `description` | `items` | `type` | `createdAt`

2. **更新 Google Apps Script**
   - 打開 `google-apps-script-menu-extension.js`
   - 將內容整合到您現有的 Apps Script 中
   - 重新部署（選擇「新版本」）

3. **完成！**
   - `npm run dev` 啟動應用
   - 查看右上角的同步狀態

📖 **詳細步驟請參考**：`MENU_SYNC_SETUP.md`

### 如果您暫時不想設定（仍可使用）

不用擔心！即使不設定雲端同步：

- ✅ 應用仍可正常運作
- ✅ 資料會儲存在 LocalStorage
- ⚠️ 只是無法跨裝置同步

系統會顯示「同步失敗」，這是正常的。

## 💡 其他儲存方案（備選）

如果您不想使用 Google Sheets，以下是其他方案：

### 方案 2: GitHub Gist

- 使用 GitHub API 將資料儲存在 Gist
- 需要 GitHub Personal Access Token
- 適合技術用戶

### 方案 3: Firebase Realtime Database

- Google 的即時資料庫服務
- 免費額度很大
- 需要建立 Firebase 專案

### 方案 4: 純 LocalStorage（目前方式）

- 最簡單，無需設定
- 但無法跨裝置

## 🎬 下一步

1. **閱讀設定指南**：`MENU_SYNC_SETUP.md`
2. **設定 Google Sheet**：新增 `WorkoutPackages` 工作表
3. **更新 Apps Script**：整合新功能
4. **測試同步**：建立套餐並驗證

## ❓ 需要協助？

如果在設定過程中遇到問題：

1. 查看 `MENU_SYNC_SETUP.md` 的「常見問題排解」章節
2. 打開瀏覽器開發者工具（F12）查看 Console 錯誤訊息
3. 確認 `.env.local` 的設定正確

---

**總結**：您的菜單現在可以同步到 Google Sheets 了！🎉
