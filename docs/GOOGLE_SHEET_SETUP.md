# Google Sheet 設定指南

## 概述

本應用程式使用 Google Sheets 作為後端資料庫，需要設定三個分頁來儲存不同類型的資料。

## 分頁設定

### 1. Bruce 分頁（訓練紀錄）

**用途：** 儲存 Bruce 的訓練紀錄

**欄位設定（第一列）：**

| ID | Date | ActionZh | ActionEn | TargetMuscle | Weight | Reps | RPE | Notes | NextTarget | CreatedAt |
|----|------|----------|----------|--------------|--------|------|-----|-------|------------|-----------|

**欄位說明：**

- `ID`: 紀錄唯一識別碼（自動生成）
- `Date`: 訓練日期 (YYYY-MM-DD)
- `ActionZh`: 動作中文名稱
- `ActionEn`: 動作英文名稱
- `TargetMuscle`: 目標肌群
- `Weight`: 重量 (kg) 或有氧資訊
- `Reps`: 次數或時間
- `RPE`: 強度評分 (1-10)
- `Notes`: 備註
- `NextTarget`: 下次目標
- `CreatedAt`: 建立時間戳記

### 2. Linda 分頁（訓練紀錄）

**用途：** 儲存 Linda 的訓練紀錄

**欄位設定：** 與 Bruce 分頁相同

### 3. Exercises 分頁（動作資料庫）⭐ 新增

**用途：** 儲存所有可用的訓練動作資料

**欄位設定（第一列）：**

| ActionZh | ActionEn | TargetMuscle | Type |
|----------|----------|--------------|------|

**欄位說明：**

- `ActionZh`: 動作中文名稱（必填）
- `ActionEn`: 動作英文名稱（選填）
- `TargetMuscle`: 目標肌群（選填）
- `Type`: 動作類型，填入 `strength` 或 `cardio`（預設為 `strength`）

**範例資料：**

| ActionZh | ActionEn | TargetMuscle | Type |
|----------|----------|--------------|------|
| 羅馬尼亞硬舉 | Romanian Deadlift | 腿後肌群 | strength |
| 槓鈴臥推 | Barbell Bench Press | 胸大肌 | strength |
| 過頭肩推 | Overhead Press | 三角肌前中束 | strength |
| 腿屈伸 | Leg Extension | 股四頭肌 | strength |
| 頸後深蹲 | Back Squat | 股四頭肌 | strength |
| 胸上緣 | Incline Press | 胸大肌上緣 | strength |
| 股四頭肌 | Quad Exercise | 股四頭肌 | strength |
| 背闊肌 | Lat Pulldown | 背闊肌 | strength |
| 跑步機 | Treadmill | 心肺 | cardio |
| 滑步機 | Elliptical | 心肺 | cardio |

### 4. WorkoutPackages 分頁（菜單套餐）⭐ 新增

**用途：** 儲存自訂的訓練菜單套餐，支援雲端同步

**欄位設定（第一列）：**

| ID | Name | Description | Items | Type | CreatedAt |
|----|------|-------------|-------|------|-----------|

**欄位說明：**

- `ID`: 套餐唯一識別碼
- `Name`: 套餐名稱
- `Description`: 套餐描述
- `Items`: JSON 格式的訓練動作清單
- `Type`: 套餐類型 (`custom` 或 `preset`)
- `CreatedAt`: 建立時間

## 設定步驟

1. **建立 Google Sheet**
   - 前往 [Google Sheets](https://sheets.google.com)
   - 建立新的試算表

2. **建立四個分頁**
   - 重新命名第一個分頁為 `Bruce`
   - 新增第二個分頁，命名為 `Linda`
   - 新增第三個分頁，命名為 `Exercises`
   - 新增第四個分頁，命名為 `WorkoutPackages`

3. **設定欄位標題**
   - 在 `Bruce` 和 `Linda` 分頁的第一列填入訓練紀錄欄位
   - 在 `Exercises` 分頁的第一列填入動作資料欄位
   - 在 `WorkoutPackages` 分頁的第一列填入套餐資料欄位

4. **填入動作資料**
   - 在 `Exercises` 分頁填入你的訓練動作清單
   - 至少填入 `ActionZh` 欄位
   - 建議填入所有欄位以獲得最佳體驗

5. **部署 Apps Script**
   - 參考 `AppScript_v2.gs` 檔案中的設定說明
   - 設定 AUTH_TOKEN
   - 部署為 Web App

## 注意事項

- ⚠️ 分頁名稱必須完全符合（區分大小寫）
- ⚠️ 欄位標題必須完全符合（區分大小寫）
- ✅ 應用程式會自動從 `Exercises` 分頁載入動作資料
- ✅ 如果 `Exercises` 分頁不存在或為空，會使用預設動作清單
- ✅ 本地新增的自訂動作會與遠端動作合併顯示

## 更新動作資料

1. 直接在 Google Sheet 的 `Exercises` 分頁新增、修改或刪除動作
2. 重新整理應用程式即可看到更新後的動作清單
3. 不需要重新部署 Apps Script

## 疑難排解

**Q: 動作清單沒有更新？**

- 確認 `Exercises` 分頁名稱正確
- 確認欄位標題正確
- 檢查瀏覽器控制台是否有錯誤訊息
- 嘗試清除瀏覽器快取後重新整理

**Q: 顯示「尚未設定 API URL」？**

- 確認 `.env.local` 檔案中有設定 `VITE_APP_SCRIPT_URL`
- 確認 Apps Script 已正確部署為 Web App

**Q: 本地新增的動作不見了？**

- 本地動作儲存在瀏覽器的 localStorage
- 清除瀏覽器資料會導致本地動作遺失
- 建議將常用動作直接加入 Google Sheet 的 `Exercises` 分頁
