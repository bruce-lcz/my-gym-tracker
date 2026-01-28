export interface Exercise {
  zh: string;
  en: string;
  targetMuscle: string;
  type?: "strength" | "cardio";
  part?: string; // e.g. "胸部", "下肢"
}

/**
 * 預設動作清單 - 僅作為最終 fallback 使用
 */
const DEFAULT_EXERCISES: Exercise[] = [
  { zh: "深蹲", en: "Squat", targetMuscle: "股四頭肌、臀大肌", type: "strength", part: "下肢" },
  { zh: "臥推", en: "Bench Press", targetMuscle: "胸大肌", type: "strength", part: "胸部" },
  { zh: "硬舉", en: "Deadlift", targetMuscle: "腿後肌群、下背", type: "strength", part: "下肢" },
  { zh: "肩推", en: "Shoulder Press", targetMuscle: "三角肌", type: "strength", part: "肩部" },
  { zh: "划船", en: "Row", targetMuscle: "背闊肌", type: "strength", part: "背部" },
  { zh: "二頭彎舉", en: "Biceps Curl", targetMuscle: "肱二頭肌", type: "strength", part: "手臂/核心" },
  { zh: "三頭下壓", en: "Triceps Pushdown", targetMuscle: "肱三頭肌", type: "strength", part: "手臂/核心" },
  { zh: "跑步", en: "Running", targetMuscle: "心肺", type: "cardio", part: "有氧" }
];

/**
 * 從 localStorage 讀取自訂動作
 */
function getCustomExercises(): Exercise[] {
  try {
    const stored = localStorage.getItem("customExercises");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 從 Google Sheets 載入動作清單
 */
export async function fetchExercisesFromSheet(): Promise<Exercise[]> {
  try {
    const { fetchExercises } = await import("./api");
    const res = await fetchExercises();

    if (res.ok && res.data && res.data.length > 0) {
      const { PREDEFINED_EXERCISES_LIST } = await import("./data/exerciseList");

      const customExercises = getCustomExercises();
      console.log(`✅ 已從 Google Sheets 載入 ${res.data.length} 個動作`);

      // Merge backend data with local category knowledge
      // Google Apps Script now correctly returns: {part, zh, en, targetMuscle, type}
      const enrichedBackendData = res.data.map(ex => {
        const match = PREDEFINED_EXERCISES_LIST.find(p => p.zh === ex.zh);
        if (match) {
          // Prefer Google Sheets data, fallback to static list
          return {
            ...ex,
            part: ex.part || match.part,
            type: ex.type || match.type,
            targetMuscle: ex.targetMuscle || match.targetMuscle
          };
        }
        return ex;
      });

      if (customExercises.length > 0) {
        console.log(`✅ 已合併 ${customExercises.length} 個本地自訂動作`);
      }
      return [...enrichedBackendData, ...customExercises];
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
 * 儲存自訂動作到 localStorage
 */
export function saveCustomExercise(exercise: Exercise) {
  const customExercises = getCustomExercises();
  const exists = customExercises.some(ex => ex.zh === exercise.zh);

  if (!exists) {
    customExercises.push(exercise);
    localStorage.setItem("customExercises", JSON.stringify(customExercises));
  }
}

/**
 * 從所有來源載入動作清單（優先順序：Google Sheets > localStorage > 預設）
 */
export async function fetchExercises(): Promise<Exercise[]> {
  try {
    // 1. Try Google Sheets
    const sheetExercises = await fetchExercisesFromSheet();
    if (sheetExercises.length > 0) {
      // Cache to localStorage for offline use
      localStorage.setItem("exercises", JSON.stringify(sheetExercises));
      return sheetExercises;
    }

    // 2. Fallback to localStorage cache
    const cached = localStorage.getItem("exercises");
    if (cached) {
      console.warn("⚠️ 使用快取的動作清單");
      return JSON.parse(cached);
    }

    // 3. Final fallback to defaults
    console.warn("⚠️ 使用預設動作清單");
    return DEFAULT_EXERCISES;

  } catch (error) {
    console.error("❌ 載入動作清單失敗:", error);

    // Try localStorage as emergency fallback
    try {
      const cached = localStorage.getItem("exercises");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore cache errors
    }

    return DEFAULT_EXERCISES;
  }
}

/**
 * 同步載入動作清單（僅從 localStorage，用於初始化）
 */
export function loadExercises(): Exercise[] {
  try {
    const cached = localStorage.getItem("exercises");
    if (cached) {
      return JSON.parse(cached);
    }
    return DEFAULT_EXERCISES;
  } catch {
    return DEFAULT_EXERCISES;
  }
}

/**
 * 清除本地快取的動作清單
 */
export function clearExerciseCache() {
  localStorage.removeItem("exercises");
  localStorage.removeItem("customExercises");
}
