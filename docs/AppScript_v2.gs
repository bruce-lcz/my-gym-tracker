/**
 * GYM TRACKER BACKEND
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet.
 * 2. Create two sheets (tabs) named exactly: "Bruce" and "Linda".
 * 3. In both sheets, set the header row (Row 1) as follows:
 *    [ID, Date, ActionZh, ActionEn, TargetMuscle, Weight, Reps, RPE, Notes, NextTarget, CreatedAt]
 * 4. Open Extensions > Apps Script.
 * 5. Paste this code.
 * 6. Set up Token Security:
 *    - Click on "Project Settings" (gear icon on left)
 *    - Scroll to "Script Properties"
 *    - Click "Add script property"
 *    - Name: AUTH_TOKEN
 *    - Value: your-secret-token-123 (same as in your .env file)
 * 7. Deploy > New Deployment > Web App > Execute as: Me > Who has access: Anyone.
 * 8. Copy the URL and paste it into your .env file as VITE_APP_SCRIPT_URL.
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
    
    return response({ error: "Unknown action" });
    
  } catch (err) {
    return response({ error: err.toString() });
  }
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

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function test() {
  console.log(getLogs("Bruce"));
}
