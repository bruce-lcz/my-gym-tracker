import { APP_CONFIG, defaultHeaders } from "./config";
import { ApiResult, TrainingLog, RawLog, User, AIAnalysis } from "./types";

type FetchOptions = {
  method: "GET" | "POST";
  body?: unknown;
  params?: Record<string, string>;
};

const buildUrl = (params?: Record<string, string>) => {
  const base = APP_CONFIG.apiBase;
  if (!base) return "";

  // Build query parameters
  const allParams = { ...params };
  if (APP_CONFIG.token) {
    allParams.token = APP_CONFIG.token;
  }

  const queryString = Object.entries(allParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  // Handle both absolute URLs (production) and relative paths (dev proxy)
  if (base.startsWith('http')) {
    const url = new URL(base);
    url.search = queryString;
    return url.toString();
  } else {
    // Relative path for proxy
    return queryString ? `${base}?${queryString}` : base;
  }
};

const request = async <T>(options: FetchOptions): Promise<ApiResult<T>> => {
  if (!APP_CONFIG.apiBase) {
    return { ok: false, error: "尚未設定 Apps Script Web App URL" };
  }

  try {
    const fetchOptions: RequestInit = {
      method: options.method,
      redirect: 'follow'
    };

    // Only set body for POST
    if (options.method === 'POST' && options.body) {
      fetchOptions.headers = defaultHeaders;
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(buildUrl(options.params), fetchOptions);

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error ?? "未知錯誤" };
    }
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "網路錯誤" };
  }
};

export const fetchLogs = async (user: User) => {
  const res = await request<RawLog[]>({
    method: "GET",
    params: { action: "logs", user }
  });
  if (!res.ok || !res.data) return { ok: res.ok, error: res.error };

  // REGROUPING LOGIC: Group by (Date + ActionZh)
  // Input: List of RawLog (1 Row = 1 Set)
  // Output: List of TrainingLog (1 Session = Multiple Sets)

  const groupedHelper: Record<string, TrainingLog> = {};

  // Assuming res.data is ordered by Date Desc (from backend)
  // We want to preserve that order roughly.

  res.data.forEach(row => {
    const key = `${row.date}_${row.actionZh}`;

    if (!groupedHelper[key]) {
      groupedHelper[key] = {
        id: row.id, // Use the ID of the first row encountered (or random)
        actionZh: row.actionZh,
        actionEn: row.actionEn,
        targetMuscle: row.targetMuscle,
        currentDate: row.date,
        sets: [],
        rpe: row.rpe,
        notes: row.notes,
        nextTarget: row.nextTarget,
        createdAt: row.createdAt
      };
    }

    if (row.weight || row.reps) {
      groupedHelper[key].sets.push({
        weight: String(row.weight || ''),
        reps: String(row.reps || '')
      });
    }
  });

  const mapped: TrainingLog[] = Object.values(groupedHelper).sort((a, b) => {
    return (b.currentDate || "").localeCompare(a.currentDate || "");
  });

  return { ok: true, data: mapped };
};

export const createLog = (user: User, payload: TrainingLog) =>
  request<{ message: string }>({
    method: "POST",
    body: payload,
    params: { action: "logs", user }
  });

export const fetchExercises = async () => {
  const res = await request<Array<{
    zh: string;
    en: string;
    targetMuscle: string;
    type?: "strength" | "cardio";
  }>>({
    method: "GET",
    params: { action: "exercises" }
  });

  if (!res.ok || !res.data) {
    return { ok: res.ok, error: res.error, data: [] };
  }

  return { ok: true, data: res.data };
};

export const createExercise = (payload: {
  zh: string;
  en: string;
  targetMuscle: string;
  type?: "strength" | "cardio";
}) =>
  request<{ message: string }>({
    method: "POST",
    body: payload,
    params: { action: "exercises" }
  });


export const saveAIAnalysis = (user: User, content: string) =>
  request<{ message: string }>({
    method: "POST",
    body: { content },
    params: { action: "ai_analysis", user }
  });

export const fetchAIAnalysis = async (user: User) => {
  const res = await request<AIAnalysis[]>({
    method: "GET",
    params: { action: "ai_analysis", user }
  });
  return res;
};
