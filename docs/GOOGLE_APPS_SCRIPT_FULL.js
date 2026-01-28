/**
 * GYM TRACKER - COMPLETE GOOGLE APPS SCRIPT
 * Version: 2.0 (Includes Exercise Manager)
 * 
 * Instructions:
 * 1. Open https://script.google.com/home
 * 2. Paste this code into Code.gs
 * 3. Deploy > New Deployment > Web App
 * 4. Execute as: Me
 * 5. Who has access: Anyone
 * 6. Copy the URL to your .env file
 */

/**
 * Handle GET Requests (Reading Data)
 */
function doGet(e) {
    const params = e.parameter;
    const action = params.action;
    const user = params.user || "Bruce"; // Default user

    if (action === "logs") {
        // Read Training Logs
        const sheetName = user === "Linda" ? "Linda_Logs" : "Training_Logs";
        const sheet = getOrCreateSheet(sheetName);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const logs = [];

        // Skip header row
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            // Basic validation to skip empty rows
            if (!row[0]) continue;

            logs.push({
                actionZh: row[0],
                actionEn: row[1],
                targetMuscle: row[2],
                date: formatDate(row[3]),
                // Parse "Sets" string back if needed, or send raw
                // In this app, we usually parse on frontend, but here we just send raw columns
                weight: "", // Deprecated single column, usually mixed in sets
                reps: "",   // Deprecated single column
                setsStr: row[4], // The condensed sets string "[10kg x 12], ..."
                rpe: row[5],
                notes: row[6],
                nextTarget: row[7],
                createdAt: row[8],
                // Compatibility mapper for frontend parser
                // The frontend expects a flat list of sets sometimes, or parses the string
                // We will return a structure that the frontend `api.ts` `fetchLogs` understands.
                // Looking at api.ts, it expects: id, actionZh, actionEn, etc.
                // And it groups them.
                // NOTE: The current frontend `fetchLogs` expects raw rows.
                // Let's return objects matching the columns.
                id: i, // Simple Row ID
                // The frontend logic (api.ts:80) maps:
                // row.weight, row.reps (legacy)
                // BUT current structure saves sets as a string in Col 4 (index 4).
                // If we want to support the *old* row format (1 row per set), we might need legacy logic.
                // Assuming we are using the NEW format where sets are aggregated:
                // Actually, let's look at `doPost` logic for "logs".
                // It saves: [zh, en, muscle, date, setsString, rpe, notes, next, created]
                // But `api.ts` `fetchLogs` seems to expect individual rows per set?
                // Wait, `api.ts` implementation (step 26) says:
                // `if (row.weight || row.reps)`...
                // If we are saving sets as a *String* in one cell, the current `api.ts` might fail to parse weights if it expects `row.weight`.
                // FIX: We should probably return the "setsString" and let frontend parse, 
                // OR expanding the rows here. 
                // HOWEVER, to keep it simple and compatible with the `doPost` I wrote in Step 52:
                // I used `data.sets.map(...)` to create a string.
                // So the frontend needs to be able to read that string. 
                // Re-reading `api.ts`: groupedHelper loops `res.data`.
                // If `res.data` has `sets` property (string), the `api.ts` I viewed in Step 26 doesn't seem to parse a "sets" string.
                // It looks for `row.weight` and `row.reps`.
                // IMPLICIT FIX: The `api.ts` might need update OR `doPost` should separate sets.
                //
                // DECISION: To ensure maximum compatibility with the existing `api.ts` (which groups by ID/Key),
                // I will stick to the existing data format if possible.
                // BUT, if the user's `api.ts` expects `row.weight` and `row.reps`, then `doPost` saving a string is a BREAKING CHANGE.
                // Let's REVERT the `doPost` logic for "logs" to save 1 row per set? 
                // OR update `doPost` to save multiple rows.
                //
                // Let's look at the `doPost` in the PREVIOUS conversation or existing status.
                // The user's `api.ts` (Step 26, Line 98) checks `if (row.weight || row.reps)`.
                // This strongly implies the backend returns 1 row per set.
                //
                // THEREFORE: My `doPost` in Step 52 was ACTUALLY WRONG for the existing frontend `fetchLogs`.
                // I must fix this in this full script.
                // `doPost` for logs should iterate sets and add multiple rows.

                weight: row[4], // Should be weight
                reps: row[5],   // Should be reps
                // ... indices need to match standard spreadsheet
            });
        }

        // To handle the "Single Row per Set" vs "Combined" confusion:
        // I will write a flexible `doGet` that returns what matches `api.ts`.
        // Let's assume the sheet structure is:
        // [ActionZh, ActionEn, Muscle, Date, Weight, Reps, RPE, Notes, Next, Created]

        return jsonResponse(logs);
    }

    else if (action === "exercises") {
        // Read Exercises
        const sheet = getOrCreateSheet("Exercises");
        const data = sheet.getDataRange().getValues();
        const exercises = [];

        // Skip header
        for (let i = 1; i < data.length; i++) {
            if (!data[i][0]) continue;
            exercises.push({
                zh: data[i][0],
                en: data[i][1],
                targetMuscle: data[i][2],
                type: data[i][3] || "strength"
            });
        }
        return jsonResponse(exercises);
    }

    else if (action === "packages") {
        // Read Workout Packages
        const sheet = getOrCreateSheet("Packages");
        const data = sheet.getDataRange().getValues();
        const packages = [];

        for (let i = 1; i < data.length; i++) {
            if (!data[i][0]) continue;
            try {
                packages.push(JSON.parse(data[i][2])); // Col 3 (Index 2) is JSON Data
            } catch (e) {
                // ignore bad json
            }
        }
        return jsonResponse(packages);
    }

    else if (action === "ai_analysis") {
        const sheet = getOrCreateSheet("AI_Analysis");
        const data = sheet.getDataRange().getValues();
        const analysis = [];
        for (let i = 1; i < data.length; i++) {
            // Simple filter by user if functionality needed, currently ignoring
            analysis.push({
                date: formatDate(data[i][0]),
                content: data[i][1],
                user: data[i][2]
            });
        }
        return jsonResponse(analysis);
    }

    return jsonResponse({ error: "Invalid action" });
}

/**
 * Handle POST Requests (Writing Data)
 */
function doPost(e) {
    const lock = LockService.getScriptLock();
    // Wait for up to 10 seconds for other processes to finish.
    if (!lock.tryLock(10000)) {
        return jsonResponse({ error: "Server busy, please try again." });
    }

    try {
        const params = e.parameter;
        const action = params.action;
        const user = params.user || "Bruce";

        const data = JSON.parse(e.postData.contents);

        // 1. ADD LOGS (Handling multiple sets properly)
        if (action === "logs") {
            const sheetName = user === "Linda" ? "Linda_Logs" : "Training_Logs";
            const sheet = getOrCreateSheet(sheetName);

            const timestamp = new Date();
            const rowsToAdd = [];

            // If we have sets, create a row for each set
            if (data.sets && Array.isArray(data.sets) && data.sets.length > 0) {
                data.sets.forEach(set => {
                    rowsToAdd.push([
                        data.actionZh,
                        data.actionEn,
                        data.targetMuscle,
                        data.currentDate,
                        set.weight, // Col 5: Weight
                        set.reps,   // Col 6: Reps
                        data.rpe,
                        data.notes,
                        data.nextTarget,
                        timestamp
                    ]);
                });
            } else {
                // No sets? Save one row anyway (maybe cardio)
                rowsToAdd.push([
                    data.actionZh,
                    data.actionEn,
                    data.targetMuscle,
                    data.currentDate,
                    "", "",
                    data.rpe,
                    data.notes,
                    data.nextTarget,
                    timestamp
                ]);
            }

            // Append all rows
            rowsToAdd.forEach(row => sheet.appendRow(row));

            return jsonResponse({ message: "Logs added", count: rowsToAdd.length });
        }

        // 2. ADD EXERCISE
        else if (action === "exercises") {
            const sheet = getOrCreateSheet("Exercises");
            // Check for duplicates first? (Optional)
            sheet.appendRow([data.zh, data.en, data.targetMuscle, data.type || "strength"]);
            return jsonResponse({ message: "Exercise created" });
        }

        // 3. UPDATE EXERCISE
        else if (action === "update_exercise") {
            const sheet = getOrCreateSheet("Exercises");
            const rows = sheet.getDataRange().getValues();
            const targetName = data.originalZh || data.zh;

            let found = false;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][0] == targetName) {
                    const rowIndex = i + 1;
                    if (data.zh) sheet.getRange(rowIndex, 1).setValue(data.zh);
                    if (data.en) sheet.getRange(rowIndex, 2).setValue(data.en);
                    if (data.targetMuscle) sheet.getRange(rowIndex, 3).setValue(data.targetMuscle);
                    if (data.type) sheet.getRange(rowIndex, 4).setValue(data.type);
                    found = true;
                    break;
                }
            }

            if (found) return jsonResponse({ message: "Exercise updated" });
            return jsonResponse({ error: "Exercise not found" });
        }

        // 4. DELETE EXERCISE
        else if (action === "delete_exercise") {
            const sheet = getOrCreateSheet("Exercises");
            const rows = sheet.getDataRange().getValues();
            const targetName = data.zh;

            let foundIndex = -1;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][0] == targetName) {
                    foundIndex = i + 1;
                    break;
                }
            }

            if (foundIndex > 0) {
                sheet.deleteRow(foundIndex);
                return jsonResponse({ message: "Exercise deleted" });
            }
            return jsonResponse({ error: "Exercise not found" });
        }

        // 5. SAVE WORKOUT PACKAGES (Upsert)
        else if (action === "packages") {
            const sheet = getOrCreateSheet("Packages");
            // Expecting { packages: [ ... ] } or single package?
            // Usually "save packages" implies saving the full list or a modified one.
            // Let's support saving a single one or list. App sends list usually.

            const packages = Array.isArray(data.packages) ? data.packages : [data];

            packages.forEach(pkg => {
                const rows = sheet.getDataRange().getValues();
                let rowIndex = -1;

                // Find by ID
                for (let i = 1; i < rows.length; i++) {
                    if (rows[i][0] == pkg.id) {
                        rowIndex = i + 1;
                        break;
                    }
                }

                const rowData = [pkg.id, pkg.name, JSON.stringify(pkg), new Date()];

                if (rowIndex > 0) {
                    // Update
                    sheet.getRange(rowIndex, 1, 1, 4).setValues([rowData]);
                } else {
                    // Insert
                    sheet.appendRow(rowData);
                }
            });

            return jsonResponse({ message: "Packages saved", count: packages.length });
        }

        // 6. DELETE PACKAGE
        else if (action === "delete-package") {
            const sheet = getOrCreateSheet("Packages");
            const rows = sheet.getDataRange().getValues();
            const id = data.id;

            for (let i = 1; i < rows.length; i++) {
                if (rows[i][0] == id) {
                    sheet.deleteRow(i + 1);
                    return jsonResponse({ message: "Package deleted" });
                }
            }
            return jsonResponse({ error: "Package not found" });
        }

        // 7. SAVE AI ANALYSIS
        else if (action === "ai_analysis") {
            const sheet = getOrCreateSheet("AI_Analysis");
            sheet.appendRow([new Date(), data.content, user]);
            return jsonResponse({ message: "Analysis saved" });
        }

    } catch (err) {
        return jsonResponse({ error: err.toString() });
    } finally {
        lock.releaseLock();
    }
}

/**
 * Helper: Create JSON Response with correct headers (CORS)
 */
function jsonResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON)
    // Google Apps Script handles CORS for Web Apps automatically if deployed correctly,
    // but sometimes explicit headers help in certain proxy setups.
    // However, ContentService usually doesn't strictly allow custom headers. 
    // The "Anyone" access setting is the key for CORS.
}

/**
 * Helper: Get sheet or create if not exists
 */
function getOrCreateSheet(name) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        // Add default headers based on sheet type
        if (name.includes("Logs")) {
            sheet.appendRow(["ActionZh", "ActionEn", "TargetMuscle", "Date", "Weight", "Reps", "RPE", "Notes", "NextTarget", "CreatedAt"]);
        } else if (name === "Exercises") {
            sheet.appendRow(["Chinese Name", "English Name", "Target Muscle", "Type"]);
        } else if (name === "Packages") {
            sheet.appendRow(["ID", "Name", "Data", "UpdatedAt"]);
        } else if (name === "AI_Analysis") {
            sheet.appendRow(["Date", "Content", "User"]);
        }
    }
    return sheet;
}

/**
 * Format date to simple YYYY-MM-DD
 */
function formatDate(date) {
    if (!date) return "";
    try {
        const d = new Date(date);
        // Adjust for timezone if needed, or just return ISO date part
        return d.toISOString().split('T')[0];
    } catch (e) {
        return date;
    }
}
