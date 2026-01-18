/**
 * 初始化預設菜單套餐到 Google Sheets
 * 
 * 使用方式：
 * 1. 開啟你的 Google Sheet
 * 2. 確保已有 "WorkoutPackages" 工作表（或執行此腳本會自動建立）
 * 3. 在 Apps Script 編輯器中執行此函數：initializePresetPackages
 * 4. 只需執行一次即可
 */

function initializePresetPackages() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("WorkoutPackages");
  
  // 如果工作表不存在，建立它
  if (!sheet) {
    sheet = ss.insertSheet("WorkoutPackages");
    sheet.getRange(1, 1, 1, 6).setValues([["ID", "Name", "Description", "Items", "Type", "CreatedAt"]]);
  }
  
  // 預設菜單套餐定義
  const presetPackages = [
    {
      id: "preset-upper-power",
      name: "上半身力量 (Upper Power)",
      description: "針對胸、背、肩的基礎力量訓練",
      type: "preset",
      items: [
        { action: "Barbell Bench Press", sets: 3, reps: "5-8" },
        { action: "Barbell Bent Over Row", sets: 3, reps: "6-10" },
        { action: "Overhead Press", sets: 3, reps: "8-12" },
        { action: "Pull Up", sets: 3, reps: "Max" },
        { action: "Dumbbell Bicep Curl", sets: 2, reps: "12-15" }
      ]
    },
    {
      id: "preset-lower-power",
      name: "下半身力量 (Lower Power)",
      description: "深蹲、硬舉為主的腿部訓練",
      type: "preset",
      items: [
        { action: "Barbell Squat", sets: 3, reps: "5-8" },
        { action: "Romanian Deadlift", sets: 3, reps: "8-12" },
        { action: "Leg Press", sets: 3, reps: "10-15" },
        { action: "Walking Lunge", sets: 2, reps: "20" },
        { action: "Calf Raise", sets: 3, reps: "15-20" }
      ]
    },
    {
      id: "preset-full-body",
      name: "全身循環 (Full Body)",
      description: "一次練完全身主要肌群，適合時間有限者",
      type: "preset",
      items: [
        { action: "Barbell Squat", sets: 3, reps: "8-12" },
        { action: "Barbell Bench Press", sets: 3, reps: "8-12" },
        { action: "Barbell Bent Over Row", sets: 3, reps: "8-12" },
        { action: "Overhead Press", sets: 2, reps: "12" },
        { action: "Plank", sets: 3, reps: "60s" }
      ]
    },
    {
      id: "preset-cardio-core",
      name: "核心有氧 (Core & Cardio)",
      description: "強化核心並燃燒脂肪",
      type: "preset",
      items: [
        { action: "Treadmill", sets: 1, reps: "20 min", weight: "Spd:9 Inc:2" },
        { action: "Crunch", sets: 3, reps: "20" },
        { action: "Leg Raise", sets: 3, reps: "15" },
        { action: "Plank", sets: 3, reps: "45s" },
        { action: "Mountain Climber", sets: 3, reps: "30s" }
      ]
    }
  ];
  
  // 檢查是否已有資料
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const existingData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    const hasPresets = existingData.some(row => {
      const id = row[0];
      return id && id.toString().startsWith("preset-");
    });
    
    if (hasPresets) {
      Logger.log("⚠️  預設套餐已存在，請先手動刪除舊的預設套餐再執行此腳本");
      return;
    }
  }
  
  // 準備要寫入的資料
  const timestamp = new Date().toISOString();
  const rows = presetPackages.map(pkg => {
    return [
      pkg.id,
      pkg.name,
      pkg.description,
      JSON.stringify(pkg.items),
      pkg.type,
      timestamp
    ];
  });
  
  // 寫入資料
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, 6).setValues(rows);
  
  Logger.log(`✅ 成功建立 ${rows.length} 個預設菜單套餐`);
  Logger.log("預設套餐已寫入 Google Sheets，可以在前端查看！");
}
