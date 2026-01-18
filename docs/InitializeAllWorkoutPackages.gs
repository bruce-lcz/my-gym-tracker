/**
 * 初始化完整菜單套餐到 Google Sheets
 * 包含分類和顏色標記
 * 
 * 使用方式：
 * 1. 開啟你的 Google Sheet
 * 2. 在 Apps Script 編輯器中執行此函數：initializeAllWorkoutPackages
 * 3. 只需執行一次即可
 * 
 * 分類與顏色：
 * - 純器材新手分化：藍色系 (#E3F2FD)
 * - 功能性與效率：綠色系 (#E8F5E9)
 * - 自由重量進階：橘色系 (#FFF3E0)
 */

function initializeAllWorkoutPackages() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("WorkoutPackages");
  
  // 如果工作表不存在，建立它
  if (!sheet) {
    sheet = ss.insertSheet("WorkoutPackages");
    sheet.getRange(1, 1, 1, 7).setValues([["ID", "Name", "Description", "Items", "Type", "Category", "CreatedAt"]]);
    
    // 設定標題列樣式
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setBackground("#4A90E2");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
  }
  
  // ==================== 完整菜單定義 ====================
  
  const allPackages = [
    // ========== 類別一：純器材新手分化 ==========
    {
      id: "machine-push-beginner",
      name: "器材-推系列 (胸/肩/三頭)",
      description: "純器材新手分化 - 適合初學者的推日訓練",
      category: "純器材新手分化",
      type: "preset",
      items: [
        { action: "坐姿機械推胸 (Chest Press)", sets: 4, reps: "10-12", weight: "40" },
        { action: "機械上斜推胸 (Incline Press)", sets: 3, reps: "12", weight: "30" },
        { action: "機械肩部推舉 (Shoulder Press)", sets: 4, reps: "12", weight: "20" },
        { action: "機械側平舉 (Lateral Raise)", sets: 4, reps: "15", weight: "15" },
        { action: "滑輪三頭下壓 (Tricep Pushdown)", sets: 3, reps: "15", weight: "20" },
        { action: "跑步機 (斜度5/速度5.5)", sets: 1, reps: "15min", weight: "" }
      ]
    },
    {
      id: "machine-pull-beginner",
      name: "器材-拉系列 (背/後三角/二頭)",
      description: "純器材新手分化 - 適合初學者的拉日訓練",
      category: "純器材新手分化",
      type: "preset",
      items: [
        { action: "機械滑輪下拉 (Lat Pulldown)", sets: 4, reps: "10-12", weight: "45" },
        { action: "機械坐姿划船 (Seated Row)", sets: 4, reps: "12", weight: "40" },
        { action: "反向蝶式機 (Rear Delt Fly)", sets: 3, reps: "15", weight: "20" },
        { action: "機械二頭彎舉 (Bicep Curl)", sets: 3, reps: "12", weight: "15" },
        { action: "機械腰背伸展 (Back Extension)", sets: 3, reps: "15", weight: "20" },
        { action: "滑步機 (Elliptical)", sets: 1, reps: "15min", weight: "" }
      ]
    },
    {
      id: "machine-leg-beginner",
      name: "器材-下肢系列 (腿/臀/核心)",
      description: "純器材新手分化 - 適合初學者的腿日訓練",
      category: "純器材新手分化",
      type: "preset",
      items: [
        { action: "機械水平腿推 (Leg Press)", sets: 4, reps: "12-15", weight: "80" },
        { action: "機械腿部伸展 (Leg Extension)", sets: 4, reps: "12-15", weight: "35" },
        { action: "臥姿腿捲曲 (Leg Curl)", sets: 4, reps: "12-15", weight: "30" },
        { action: "機械髖外展 (Abductor)", sets: 3, reps: "15", weight: "40" },
        { action: "機械腹部捲曲 (Ab Crunch)", sets: 3, reps: "20", weight: "30" },
        { action: "跑步機 (斜度10/速度4.0)", sets: 1, reps: "15min", weight: "" }
      ]
    },
    
    // ========== 類別二：功能性與效率菜單 ==========
    {
      id: "posture-correction",
      name: "工程師體態矯正",
      description: "功能性訓練 - 改善圓肩駝背，強化上背與後肩",
      category: "功能性與效率",
      type: "preset",
      items: [
        { action: "臉拉 (Face Pull)", sets: 4, reps: "15", weight: "15" },
        { action: "機械坐姿划船 (寬握)", sets: 4, reps: "12", weight: "40" },
        { action: "反向蝶式機", sets: 3, reps: "15", weight: "20" },
        { action: "機械上斜推胸", sets: 3, reps: "12", weight: "30" },
        { action: "懸垂舉腿 (核心)", sets: 3, reps: "12", weight: "" },
        { action: "開合跳 (Jumping Jacks)", sets: 3, reps: "50", weight: "" }
      ]
    },
    {
      id: "full-body-fat-burn",
      name: "全身燃脂循環",
      description: "高效訓練 - 一週2~3練，高消耗、高心率",
      category: "功能性與效率",
      type: "preset",
      items: [
        { action: "機械水平腿推", sets: 3, reps: "15", weight: "80" },
        { action: "滑輪下拉 (寬握)", sets: 3, reps: "12", weight: "45" },
        { action: "機械推胸", sets: 3, reps: "12", weight: "40" },
        { action: "機械側平舉", sets: 3, reps: "15", weight: "15" },
        { action: "機械二頭彎舉", sets: 3, reps: "15", weight: "15" },
        { action: "波比跳 (Burpees)", sets: 3, reps: "10", weight: "" }
      ]
    },
    
    // ========== 類別三：自由重量進階 ==========
    {
      id: "freeweight-push-advanced",
      name: "經典推日 (自由重量)",
      description: "進階訓練 - 胸/肩/三頭自由重量為主",
      category: "自由重量進階",
      type: "preset",
      items: [
        { action: "槓鈴臥推 (Barbell Bench Press)", sets: 4, reps: "8-10", weight: "60" },
        { action: "啞鈴上斜臥推 (Incline DB Press)", sets: 3, reps: "10-12", weight: "24" },
        { action: "啞鈴肩推 (DB Shoulder Press)", sets: 3, reps: "10-12", weight: "16" },
        { action: "雙槓撐體 (Dips)", sets: 3, reps: "Max", weight: "" },
        { action: "三頭肌繩索下壓", sets: 3, reps: "12-15", weight: "20" }
      ]
    },
    {
      id: "freeweight-pull-advanced",
      name: "經典拉日 (自由重量)",
      description: "進階訓練 - 背/二頭自由重量為主",
      category: "自由重量進階",
      type: "preset",
      items: [
        { action: "引體向上 (Pull-up)", sets: 3, reps: "Max", weight: "" },
        { action: "槓鈴划船 (Barbell Row)", sets: 4, reps: "8-10", weight: "50" },
        { action: "單臂啞鈴划船 (One Arm Row)", sets: 3, reps: "12", weight: "20" },
        { action: "臉拉 (Face Pull)", sets: 3, reps: "15", weight: "15" },
        { action: "槓鈴彎舉 (Barbell Curl)", sets: 3, reps: "10-12", weight: "25" }
      ]
    },
    {
      id: "freeweight-leg-advanced",
      name: "經典腿日 (自由重量)",
      description: "進階訓練 - 深蹲、硬舉為主的腿部訓練",
      category: "自由重量進階",
      type: "preset",
      items: [
        { action: "槓鈴深蹲 (Back Squat)", sets: 4, reps: "6-8", weight: "80" },
        { action: "羅馬尼亞硬舉 (RDL)", sets: 3, reps: "8-10", weight: "70" },
        { action: "保加利亞分腿蹲 (Bulgarian Split Squat)", sets: 3, reps: "10", weight: "16" },
        { action: "腿部伸展機", sets: 3, reps: "15", weight: "50" },
        { action: "提踵 (Calf Raise)", sets: 3, reps: "20", weight: "100" }
      ]
    }
  ];
  
  // ==================== 顏色定義 ====================
  
  const categoryColors = {
    "純器材新手分化": "#E3F2FD",  // 淺藍色
    "功能性與效率": "#E8F5E9",    // 淺綠色
    "自由重量進階": "#FFF3E0"     // 淺橘色
  };
  
  // ==================== 檢查現有資料 ====================
  
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '⚠️  工作表已有資料',
      '是否要清除現有資料並重新匯入？\n\n點擊「是」將清除所有現有套餐\n點擊「否」將取消操作',
      ui.ButtonSet.YES_NO
    );
    
    if (response == ui.Button.NO) {
      Logger.log("操作已取消");
      return;
    }
    
    // 清除現有資料（保留標題列）
    sheet.getRange(2, 1, lastRow - 1, 7).clear();
  }
  
  // ==================== 寫入資料 ====================
  
  const timestamp = new Date().toISOString();
  const rows = allPackages.map(pkg => {
    return [
      pkg.id,
      pkg.name,
      pkg.description,
      JSON.stringify(pkg.items),
      pkg.type,
      pkg.category,
      timestamp
    ];
  });
  
  // 寫入所有資料
  const startRow = 2;
  sheet.getRange(startRow, 1, rows.length, 7).setValues(rows);
  
  // ==================== 設定顏色 ====================
  
  // 為每一行設定對應的背景顏色
  for (let i = 0; i < allPackages.length; i++) {
    const pkg = allPackages[i];
    const rowNumber = startRow + i;
    const color = categoryColors[pkg.category] || "#FFFFFF";
    
    // 設定整行背景色
    sheet.getRange(rowNumber, 1, 1, 7).setBackground(color);
  }
  
  // ==================== 美化格式 ====================
  
  // 設定欄寬
  sheet.setColumnWidth(1, 200);  // ID
  sheet.setColumnWidth(2, 250);  // Name
  sheet.setColumnWidth(3, 300);  // Description
  sheet.setColumnWidth(4, 400);  // Items
  sheet.setColumnWidth(5, 100);  // Type
  sheet.setColumnWidth(6, 150);  // Category
  sheet.setColumnWidth(7, 180);  // CreatedAt
  
  // 凍結標題列
  sheet.setFrozenRows(1);
  
  // 設定文字對齊
  sheet.getRange(1, 1, rows.length + 1, 7).setVerticalAlignment("middle");
  
  // ==================== 完成訊息 ====================
  
  Logger.log(`✅ 成功建立 ${rows.length} 個菜單套餐`);
  Logger.log("\n分類統計：");
  Logger.log(`  - 純器材新手分化：3 個（藍色）`);
  Logger.log(`  - 功能性與效率：2 個（綠色）`);
  Logger.log(`  - 自由重量進階：3 個（橘色）`);
  Logger.log("\n菜單已寫入 Google Sheets，可以在前端查看！");
  
  // 彈出完成訊息
  SpreadsheetApp.getUi().alert(
    '✅ 初始化完成！',
    `成功建立 ${rows.length} 個菜單套餐\n\n` +
    '分類統計：\n' +
    '  🔵 純器材新手分化：3 個\n' +
    '  🟢 功能性與效率：2 個\n' +
    '  🟠 自由重量進階：3 個\n\n' +
    '請重新整理前端頁面查看！',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
