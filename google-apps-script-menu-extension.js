// 將此程式碼加入到您現有的 Google Apps Script 中
// 記得在 Google Sheet 中新增一個名為 "WorkoutPackages" 的工作表

const PACKAGES_SHEET_NAME = "WorkoutPackages"; // 菜單套餐工作表名稱

/**
 * 擴充 doGet 函數以支援讀取菜單套餐
 */
function doGet(e) {
    try {
        const auth = authorize(e);
        if (!auth.ok) return auth.response;

        const action = e.parameter.action || "logs";

        // 原有的 logs 功能
        if (action === "logs") {
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

        // 新增：讀取菜單套餐
        if (action === "packages") {
            return getWorkoutPackages();
        }

        return json({ error: "unknown action" });
    } catch (error) {
        return json({ error: error.toString() });
    }
}

/**
 * 擴充 doPost 函數以支援儲存菜單套餐
 */
function doPost(e) {
    try {
        const auth = authorize(e);
        if (!auth.ok) return auth.response;

        const action = e.parameter.action || "logs";

        // 原有的 logs 功能
        if (action === "logs") {
            const body = JSON.parse(e.postData.contents || "{}");
            const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

            const sets = body.sets || [];
            const set1Weight = sets[0]?.weight || "";
            const set1Reps = sets[0]?.reps || "";
            const set2Weight = sets[1]?.weight || "";
            const set2Reps = sets[1]?.reps || "";
            const set3Weight = sets[2]?.weight || "";
            const set3Reps = sets[2]?.reps || "";
            const set4Weight = sets[3]?.weight || "";
            const set4Reps = sets[3]?.reps || "";

            sheet.appendRow([
                body.actionZh ?? body["動作名稱"] ?? "",
                body.actionEn ?? body["Action Name"] ?? "",
                body.targetMuscle ?? body["目標肌群"] ?? "",
                body.lastDate ?? body["上次日期"] ?? "",
                body.currentDate ?? body["本次日期"] ?? "",
                set1Weight,
                set1Reps,
                set2Weight,
                set2Reps,
                set3Weight,
                set3Reps,
                set4Weight,
                set4Reps,
                body.rpe ?? body["RPE"] ?? "",
                body.notes ?? body["備註"] ?? "",
                body.nextTarget ?? body["下次目標"] ?? "",
                new Date()
            ]);
            return json({ message: "ok" });
        }

        // 新增：儲存菜單套餐
        if (action === "packages") {
            return saveWorkoutPackages(e);
        }

        // 新增：刪除菜單套餐
        if (action === "delete-package") {
            return deleteWorkoutPackage(e);
        }

        return json({ error: "unknown action" });
    } catch (error) {
        return json({ error: error.toString() });
    }
}

/**
 * 讀取所有菜單套餐
 */
function getWorkoutPackages() {
    try {
        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(PACKAGES_SHEET_NAME);
        if (!sheet) {
            // 如果工作表不存在，回傳空陣列
            return json([]);
        }

        const values = sheet.getDataRange().getValues();
        if (values.length <= 1) {
            // 只有標題列或空白
            return json([]);
        }

        const [header, ...rows] = values;
        const packages = rows
            .filter(r => r.length && r[0]) // 過濾掉空行
            .map(r => {
                return {
                    id: r[0] || "",
                    name: r[1] || "",
                    description: r[2] || "",
                    items: JSON.parse(r[3] || "[]"),
                    type: r[4] || "custom",
                    createdAt: r[5] || ""
                };
            });

        return json(packages);
    } catch (error) {
        return json({ error: error.toString() });
    }
}

/**
 * 儲存菜單套餐（新增或更新）
 */
function saveWorkoutPackages(e) {
    try {
        const body = JSON.parse(e.postData.contents || "{}");
        const packages = body.packages || [];

        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(PACKAGES_SHEET_NAME);
        if (!sheet) {
            return json({ error: "WorkoutPackages sheet not found. Please create it first." });
        }

        // 清除現有數據（保留標題列）
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
            sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clear();
        }

        // 寫入新數據
        packages.forEach(pkg => {
            sheet.appendRow([
                pkg.id,
                pkg.name,
                pkg.description || "",
                JSON.stringify(pkg.items),
                pkg.type || "custom",
                pkg.createdAt || new Date().toISOString()
            ]);
        });

        return json({ message: "ok", count: packages.length });
    } catch (error) {
        return json({ error: error.toString() });
    }
}

/**
 * 刪除單個菜單套餐
 */
function deleteWorkoutPackage(e) {
    try {
        const body = JSON.parse(e.postData.contents || "{}");
        const packageId = body.id;

        if (!packageId) {
            return json({ error: "Package ID is required" });
        }

        const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(PACKAGES_SHEET_NAME);
        if (!sheet) {
            return json({ error: "WorkoutPackages sheet not found" });
        }

        const values = sheet.getDataRange().getValues();
        const rowIndex = values.findIndex((r, idx) => idx > 0 && r[0] === packageId);

        if (rowIndex > 0) {
            sheet.deleteRow(rowIndex + 1); // +1 because sheet rows are 1-indexed
            return json({ message: "ok" });
        } else {
            return json({ error: "Package not found" });
        }
    } catch (error) {
        return json({ error: error.toString() });
    }
}
