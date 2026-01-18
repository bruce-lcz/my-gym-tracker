/**
 * 菜單套餐同步服務
 * 負責與 Google Sheets 同步自訂菜單套餐
 */

import { WorkoutPackage } from '../types';

const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL || "";
const token = import.meta.env.VITE_APP_TOKEN || "";

/**
 * 從 Google Sheets 讀取所有菜單套餐
 */
export async function fetchWorkoutPackages(): Promise<WorkoutPackage[]> {
    if (!scriptUrl) {
        console.warn("Google Apps Script URL not configured, using localStorage only");
        return getLocalPackages();
    }

    try {
        const url = `${scriptUrl}?action=packages&token=${encodeURIComponent(token)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error("Error fetching packages from Google Sheets:", data.error);
            return getLocalPackages();
        }

        // 成功從雲端獲取，也同步到 localStorage
        if (Array.isArray(data)) {
            localStorage.setItem("customPackages", JSON.stringify(data));
            return data;
        }

        return getLocalPackages();
    } catch (error) {
        console.error("Failed to fetch packages from Google Sheets:", error);
        // 失敗時回退到 localStorage
        return getLocalPackages();
    }
}

/**
 * 儲存菜單套餐到 Google Sheets
 */
export async function saveWorkoutPackages(packages: WorkoutPackage[]): Promise<boolean> {
    // 先儲存到 localStorage（立即回饋）
    localStorage.setItem("customPackages", JSON.stringify(packages));

    if (!scriptUrl) {
        console.warn("Google Apps Script URL not configured, saved to localStorage only");
        return true;
    }

    try {
        const response = await fetch(`${scriptUrl}?action=packages&token=${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ packages }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error("Error saving packages to Google Sheets:", data.error);
            return false;
        }

        console.log(`Successfully synced ${data.count || packages.length} packages to Google Sheets`);
        return true;
    } catch (error) {
        console.error("Failed to save packages to Google Sheets:", error);
        // 雖然雲端儲存失敗，但 localStorage 已儲存
        return false;
    }
}

/**
 * 刪除單個菜單套餐
 */
export async function deleteWorkoutPackage(packageId: string, allPackages: WorkoutPackage[]): Promise<boolean> {
    const updatedPackages = allPackages.filter(p => p.id !== packageId);

    // 先更新 localStorage
    localStorage.setItem("customPackages", JSON.stringify(updatedPackages));

    if (!scriptUrl) {
        return true;
    }

    try {
        const response = await fetch(`${scriptUrl}?action=delete-package&token=${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: packageId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error("Error deleting package from Google Sheets:", data.error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Failed to delete package from Google Sheets:", error);
        return false;
    }
}

/**
 * 從 localStorage 讀取菜單套餐（備用方案）
 */
function getLocalPackages(): WorkoutPackage[] {
    try {
        const saved = localStorage.getItem("customPackages");
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to parse customPackages from localStorage:", error);
        return [];
    }
}

/**
 * 初始化時同步：優先從雲端讀取，失敗則使用本地
 */
export async function initWorkoutPackages(): Promise<WorkoutPackage[]> {
    return await fetchWorkoutPackages();
}
