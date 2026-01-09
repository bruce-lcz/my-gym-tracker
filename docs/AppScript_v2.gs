/**
 * GYM TRACKER BACKEND
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet.
 * 2. Create three sheets (tabs) named exactly: "Bruce", "Linda", and "Exercises".
 * 3. In "Bruce" and "Linda" sheets, set the header row (Row 1) as follows:
 *    [ID, Date, ActionZh, ActionEn, TargetMuscle, Weight, Reps, RPE, Notes, NextTarget, CreatedAt]
 * 4. In "Exercises" sheet, set the header row (Row 1) as follows:
 *    [ActionZh, ActionEn, TargetMuscle, Type]
 *    - ActionZh: 動作中文名稱 (e.g., 羅馬尼亞硬舉)
 *    - ActionEn: 動作英文名稱 (e.g., Romanian Deadlift)
 *    - TargetMuscle: 目標肌群 (e.g., 腿後肌群)
 *    - Type: strength 或 cardio
 * 5. Open Extensions > Apps Script.
 * 6. Paste this code.
 * 7. Set up Token Security:
 *    - Click on "Project Settings" (gear icon on left)
 *    - Scroll to "Script Properties"
 *    - Click "Add script property"
 *    - Name: AUTH_TOKEN
 *    - Value: your-secret-token-123 (same as in your .env file)
 * 8. Deploy > New Deployment > Web App > Execute as: Me > Who has access: Anyone.
 *    (OR if updating: Deploy > Manage Deployments > Edit (Pencil) > Version: New version > Deploy)
 * 9. Copy the URL and paste it into your .env file as VITE_APP_SCRIPT_URL (if it changed).
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
    
    return response({ error: "Unknown action" });
    
  } catch (err) {
    return response({ error: err.toString() });
  }
}

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
    // Headers: [ActionZh, ActionEn, TargetMuscle, Type]
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    
    // Map to object
    const exercises = data
      .filter(row => row[0]) // Filter out empty rows
      .map(row => ({
        zh: row[0],
        en: row[1] || "",
        targetMuscle: row[2] || "",
        type: row[3] || "strength"
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
      sheet.getRange(1, 1, 1, 4).setValues([["ActionZh", "ActionEn", "TargetMuscle", "Type"]]);
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

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function test() {
  console.log(getLogs("Bruce"));
}

