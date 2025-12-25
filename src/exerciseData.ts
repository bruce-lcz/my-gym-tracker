export interface Exercise {
  zh: string;
  en: string;
  targetMuscle: string;
  type?: "strength" | "cardio";
}

/**
 * 預設動作清單 - 僅作為最終 fallback 使用
 * 主要資料來源為 Google Sheets 的 "Exercises" 分頁
 */
const DEFAULT_EXERCISES: Exercise[] = [
  { zh: "羅馬尼亞硬舉", en: "Romanian Deadlift", targetMuscle: "腿後肌群", type: "strength" },
  { zh: "槓鈴臥推", en: "Barbell Bench Press", targetMuscle: "胸大肌", type: "strength" },
  { zh: "跑步機", en: "Treadmill", targetMuscle: "心肺", type: "cardio" },
];

/**
 * 從 localStorage 讀取使用者自訂的動作
 */
function getCustomExercises(): Exercise[] {
  const stored = localStorage.getItem("customExercises");
  if (!stored) return [];

  try {
    return JSON.parse(stored) as Exercise[];
  } catch (error) {
    console.error("Failed to parse custom exercises from localStorage:", error);
    return [];
  }
}

/**
 * 主要函數：從 Google Sheets 載入動作資料
 * 優先順序：Google Sheets > localStorage 自訂動作 > 預設動作
 */
export async function fetchExercisesFromSheet(): Promise<Exercise[]> {
  try {
    const { fetchExercises } = await import("./api");
    const res = await fetchExercises();

    if (res.ok && res.data && res.data.length > 0) {
      const customExercises = getCustomExercises();
      console.log(`✅ 已從 Google Sheets 載入 ${res.data.length} 個動作`);
      if (customExercises.length > 0) {
        console.log(`✅ 已合併 ${customExercises.length} 個本地自訂動作`);
      }
      return [...res.data, ...customExercises];
    }

    // Google Sheets 無資料時，使用預設 + 自訂動作
    console.warn("⚠️ Google Sheets 無動作資料，使用預設動作清單");
    const customExercises = getCustomExercises();
    return [...DEFAULT_EXERCISES, ...customExercises];

  } catch (error) {
    console.error("❌ 無法從 Google Sheets 載入動作資料:", error);
    const customExercises = getCustomExercises();
    return [...DEFAULT_EXERCISES, ...customExercises];
  }
}

/**
 * 儲存使用者自訂動作到 localStorage
 */
export function saveCustomExercise(exercise: Exercise): void {
  const custom = getCustomExercises();
  custom.push(exercise);
  localStorage.setItem("customExercises", JSON.stringify(custom));
  console.log(`✅ 已儲存自訂動作: ${exercise.zh}`);
}

/**
 * @deprecated 此函數僅用於向下相容，建議使用 fetchExercisesFromSheet()
 */
export function loadExercises(): Exercise[] {
  const customExercises = getCustomExercises();
  return [...DEFAULT_EXERCISES, ...customExercises];
}

