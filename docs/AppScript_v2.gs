/**
 * GYM TRACKER BACKEND (with CORS support)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet.
 * 2. Create four sheets (tabs) named exactly: "Bruce", "Linda", "Exercises", and "WorkoutPackages".
 * 3. In "Bruce" and "Linda" sheets, set the header row (Row 1) as follows:
 *    [ID, Date, ActionZh, ActionEn, TargetMuscle, Weight, Reps, RPE, Notes, NextTarget, CreatedAt]
 * 4. In "Exercises" sheet, set the header row (Row 1) as follows:
 *    [ActionZh, ActionEn, TargetMuscle, Type]
 *    - ActionZh: 動作中文名稱 (e.g., 羅馬尼亞硬舉)
 *    - ActionEn: 動作英文名稱 (e.g., Romanian Deadlift)
 *    - TargetMuscle: 目標肌群 (e.g., 腿後肌群)
 *    - Type: strength 或 cardio
 * 5. In "WorkoutPackages" sheet, set the header row (Row 1) as follows:
 *    [ID, Name, Description, Items, Type, CreatedAt]
 *    - ID: 套餐唯一識別碼
 *    - Name: 套餐名稱
 *    - Description: 套餐描述
 *    - Items: JSON 格式的訓練項目 (e.g., [{"action":"深蹲","sets":3,"reps":"10"}])
 *    - Type: preset 或 custom
 *    - CreatedAt: 建立時間
 * 6. Open Extensions > Apps Script.
 * 7. Paste this code.
 * 8. Set up Token Security:
 *    - Click on "Project Settings" (gear icon on left)
 *    - Scroll to "Script Properties"
 *    - Click "Add script property"
 *    - Name: AUTH_TOKEN
 *    - Value: your-secret-token-123 (same as in your .env file)
 * 9. Deploy > New Deployment > Web App > Execute as: Me > Who has access: Anyone.
 *    (OR if updating: Deploy > Manage Deployments > Edit (Pencil) > Version: New version > Deploy)
 * 10. Copy the URL and paste it into your .env file as VITE_APP_SCRIPT_URL (if it changed).
 * 
 * NOTE: CORS headers are enabled to allow cross-origin requests from your frontend.
 */

// Token verification
function verifyToken(token) {
  const validToken = PropertiesService.getScriptProperties().getProperty('AUTH_TOKEN');
  if (!validToken) {
    throw new Error('Server not configured. Please set AUTH_TOKEN in Script Properties.');
  }
  if (token !== validToken) {
    throw new Error('Invalid token');
  }
  return true;
}

function doPost(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    const user = params.user || "Bruce"; // Default to Bruce
    const token = params.token;
    
    // Verify token
    verifyToken(token);
    
    // Parse Body
    const body = JSON.parse(e.postData.contents);
    
    if (action === "logs") {
      return addLog(user, body);
    }
    
    if (action === "exercises") {
      return addExercise(body);
    }

    if (action === "ai_analysis") {
      return saveAIAnalysis(user, body);
    }
    
    // 新增：儲存菜單套餐
    if (action === "packages") {
      return saveWorkoutPackages(body);
    }
    
    // 新增：刪除菜單套餐
    if (action === "delete-package") {
      return deleteWorkoutPackage(body);
    }

    // 新增：更新動作
    if (action === "update_exercise") {
      return updateExercise(body);
    }

    // 新增：刪除動作
    if (action === "delete_exercise") {
      return deleteExercise(body);
    }
    
    return response({ error: "Unknown action" });
    
  } catch (err) {
    return response({ error: err.toString() });
  }
}

function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    const user = params.user || "Bruce";
    const token = params.token;
    
    // Verify token
    verifyToken(token);
    
    if (action === "logs") {
      return getLogs(user);
    }
    
    if (action === "exercises") {
      return getExercises();
    }

    if (action === "ai_analysis") {
      return getAIAnalyses(user);
    }
    
    // 新增：讀取菜單套餐
    if (action === "packages") {
      return getWorkoutPackages();
    }
    
    return response({ error: "Unknown action" });
    
  } catch (err) {
    return response({ error: err.toString() });
  }
}

// Handle CORS preflight requests
// function doOptions(e) removed - Google Apps Script does not support OPTIONS requests

function getAIAnalyses(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "AI_Analysis";
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return response([]);
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return response([]);
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  // Filter for user and Map to object
  // Headers: [ID, User, Content, Timestamp]
  const analyses = data
    .filter(row => row[1] === user)
    .map(row => ({
      id: row[0],
      user: row[1],
      content: row[2],
      timestamp: row[3]
    })).reverse();
    
  return response(analyses);
}

function saveAIAnalysis(user, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "AI_Analysis";
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, 4).setValues([["ID", "User", "Content", "Timestamp"]]);
  }
  
  const timestamp = new Date().toISOString();
  const row = [
    Utilities.getUuid(),
    user,
    data.content,
    timestamp
  ];
  
  sheet.appendRow(row);
  return response({ message: "AI Analysis saved" });
}

function getSheet(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(user);
  if (!sheet) {
    throw new Error(`Sheet for user "${user}" not found. Please create a sheet named "${user}".`);
  }
  return sheet;
}

function addLog(user, data) {
  const sheet = getSheet(user);
  const timestamp = new Date().toISOString();
  
  // Data structure from Frontend:
  // {
  //   id: "...",
  //   currentDate: "YYYY-MM-DD",
  //   actionZh: "...",
  //   actionEn: "...",
  //   targetMuscle: "...",
  //   sets: [ {weight: 10, reps: 10}, ... ],
  //   rpe: "8",
  //   notes: "...",
  //   nextTarget: "..."
  // }
  
  const rows = [];
  
  // Generate a unique Group ID for this session if not provided, or just use timestamp/random
  // But actually, we process sets.
  // Each SET becomes a ROW.
  
  data.sets.forEach((set, index) => {
    // Only save sets that have values
    if (!set.weight && !set.reps) return;
    
    const row = [
      data.id || Utilities.getUuid(), // Unique ID for the set (or shared ID for the session? Let's use unique for row, maybe shared param if needed)
      // Actually, let's use a unique ID for the ROW. The grouping will be done by (Date + Action) in frontend.
      data.currentDate,
      data.actionZh,
      data.actionEn || "",
      data.targetMuscle || "",
      set.weight,
      set.reps,
      data.rpe || "",
      data.notes || "",      // Note attaches to every set row, which is fine (redundant but safe)
      data.nextTarget || "", // Same here
      timestamp
    ];
    rows.push(row);
  });
  
  if (rows.length > 0) {
    // Append all rows
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  return response({ message: "Saved " + rows.length + " sets" });
}

function getLogs(user) {
  const sheet = getSheet(user);
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return response([]);
  }
  
  // Get all data excluding header
  const data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  
  // Map to object
  // Headers: [ID, Date, ActionZh, ActionEn, TargetMuscle, Weight, Reps, RPE, Notes, NextTarget, CreatedAt]
  const logs = data.map(row => ({
    id: row[0],
    date: Date.parse(row[1]) ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd") : row[1], // Normalize date string
    actionZh: row[2],
    actionEn: row[3],
    targetMuscle: row[4],
    weight: row[5],
    reps: row[6],
    rpe: row[7],
    notes: row[8],
    nextTarget: row[9],
    createdAt: row[10]
  })).reverse(); // Newest first
  
  return response(logs);
}

function getExercises() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Exercises");
    
    if (!sheet) {
      // Return empty array if Exercises sheet doesn't exist
      return response([]);
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return response([]);
    }
    
    // Get all data excluding header
    // Headers: [Part/部位, ActionZh/動作名稱(中), ActionEn, TargetMuscle/目標肌群, Type/類型]
    const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    // Map to object
    const exercises = data
      .filter(row => row[1]) // Filter out empty rows (check ActionZh)
      .map(row => ({
        part: row[0] || "",
        zh: row[1],
        en: row[2] || "",
        targetMuscle: row[3] || "",
        type: row[4] || "strength"
      }));
    
    return response(exercises);
  } catch (err) {
    return response({ error: err.toString() });
  }
}

function addExercise(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Exercises");
    
    // Create Exercises sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet("Exercises");
      // Add headers
      sheet.getRange(1, 1, 1, 5).setValues([["Part", "ActionZh", "ActionEn", "TargetMuscle", "Type"]]);
    }
    
    // Validate required field
    if (!data.zh || !data.zh.trim()) {
      return response({ error: "動作中文名稱為必填" });
    }
    
    // Check for duplicates
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const exists = existingData.some(row => row[0] === data.zh.trim());
      if (exists) {
        return response({ error: "此動作已存在" });
      }
    }
    
    // Prepare new row
    const newRow = [
      data.part || "",
      data.zh.trim(),
      data.en ? data.en.trim() : "",
      data.targetMuscle ? data.targetMuscle.trim() : "",
      data.type || "strength"
    ];
    
    // Append to sheet
    sheet.appendRow(newRow);
    
    return response({ message: "動作新增成功" });
  } catch (err) {
    return response({ error: err.toString() });
  }
}

function updateExercise(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Exercises");
    
    if (!sheet) {
      return response({ error: "Exercises sheet not found" });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return response({ error: "No exercises found" });
    }

    // data.originalZh is the key to find the row
    const targetName = data.originalZh || data.zh;
    
    // Get all Chinese names (Col 2, since Col 1 is Part)
    const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
    
    // Find index (visual row = index + 2)
    const index = names.findIndex(name => name == targetName);
    
    if (index === -1) {
      return response({ error: "Exercise not found: " + targetName });
    }
    
    const rowIndex = index + 2;
    
    if (data.part) sheet.getRange(rowIndex, 1).setValue(data.part);
    if (data.zh) sheet.getRange(rowIndex, 2).setValue(data.zh);
    if (data.en) sheet.getRange(rowIndex, 3).setValue(data.en);
    if (data.targetMuscle) sheet.getRange(rowIndex, 4).setValue(data.targetMuscle);
    if (data.type) sheet.getRange(rowIndex, 5).setValue(data.type);
    
    return response({ message: "Exercise updated" });
    
  } catch (err) {
    return response({ error: err.toString() });
  }
}

function deleteExercise(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Exercises");
    
    if (!sheet) {
      return response({ error: "Exercises sheet not found" });
    }
    
    const targetName = data.zh;
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return response({ error: "No exercises found" });
    }
    
    // Get all Chinese names (Col 2)
    const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
    
    const index = names.findIndex(name => name == targetName);
    
    if (index === -1) {
      return response({ error: "Exercise not found" });
    }
    
    // Delete row (index + 2)
    sheet.deleteRow(index + 2);
    
    return response({ message: "Exercise deleted" });
    
  } catch (err) {
    return response({ error: err.toString() });
  }
}

function response(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Note: Google Apps Script automatically handles CORS headers.
  // We cannot manually set headers using setHeader() as it doesn't exist.
  
  return output;
}

// ==================== 菜單套餐功能 (Workout Packages) ====================

/**
 * 讀取所有菜單套餐
 */
function getWorkoutPackages() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("WorkoutPackages");
    
    // 如果工作表不存在，自動建立
    if (!sheet) {
      sheet = ss.insertSheet("WorkoutPackages");
      sheet.getRange(1, 1, 1, 7).setValues([["ID", "Name", "Description", "Items", "Type", "Category", "CreatedAt"]]);
      return response([]);
    }
    
    const lastRow = sheet.getLastRow();
    
    // 只有標題列或空白
    if (lastRow <= 1) {
      return response([]);
    }
    
    // 讀取所有資料（排除標題列）
    const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    
    // 過濾並映射為物件
    const packages = data
      .filter(row => row[0]) // 過濾掉空行
      .map(row => {
        let items = [];
        try {
          items = typeof row[3] === 'string' ? JSON.parse(row[3]) : row[3];
        } catch (e) {
          console.error("Failed to parse items JSON:", e);
          items = [];
        }
        
        return {
          id: row[0],
          name: row[1] || "",
          description: row[2] || "",
          items: items,
          type: row[4] || "custom",
          category: row[5] || "",
          createdAt: row[6] || ""
        };
      });
    
    return response(packages);
  } catch (err) {
    return response({ error: err.toString() });
  }
}

/**
 * 儲存菜單套餐（批次更新）
 * body.packages: 所有套餐的陣列
 */
function saveWorkoutPackages(body) {
  try {
    const packages = body.packages || [];
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("WorkoutPackages");
    
    // 如果工作表不存在，建立它
    if (!sheet) {
      sheet = ss.insertSheet("WorkoutPackages");
      sheet.getRange(1, 1, 1, 7).setValues([["ID", "Name", "Description", "Items", "Type", "Category", "CreatedAt"]]);
    }
    
    // 清除現有資料（保留標題列）
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 7).clear();
    }
    
    // 如果沒有套餐，直接返回
    if (packages.length === 0) {
      return response({ message: "ok", count: 0 });
    }
    
    // 準備新資料
    const rows = packages.map(pkg => {
      return [
        pkg.id || Utilities.getUuid(),
        pkg.name || "",
        pkg.description || "",
        JSON.stringify(pkg.items || []),
        pkg.type || "custom",
        pkg.category || "",
        pkg.createdAt || new Date().toISOString()
      ];
    });
    
    // 寫入所有資料
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
    
    return response({ message: "ok", count: packages.length });
  } catch (err) {
    return response({ error: err.toString() });
  }
}

/**
 * 刪除單個菜單套餐
 * body.id: 要刪除的套餐 ID
 */
function deleteWorkoutPackage(body) {
  try {
    const packageId = body.id;
    
    if (!packageId) {
      return response({ error: "Package ID is required" });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("WorkoutPackages");
    
    if (!sheet) {
      return response({ error: "WorkoutPackages sheet not found" });
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return response({ error: "No packages to delete" });
    }
    
    // 讀取所有 ID（第一欄）
    const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    
    // 找到要刪除的行（+2 因為：startRow=2 且陣列從 0 開始）
    const rowIndex = data.findIndex(row => row[0] === packageId);
    
    if (rowIndex === -1) {
      return response({ error: "Package not found" });
    }
    
    // 刪除該行
    sheet.deleteRow(rowIndex + 2);
    
    return response({ message: "ok" });
  } catch (err) {
    return response({ error: err.toString() });
  }
}

function test() {
  console.log(getLogs("Bruce"));
}

