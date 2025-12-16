import { APP_CONFIG, defaultHeaders } from "./config";
import { ApiResult, TrainingLog } from "./types";

type FetchOptions = {
  method: "GET" | "POST";
  body?: unknown;
  params?: Record<string, string>;
};

const buildUrl = (params?: Record<string, string>) => {
  const base = APP_CONFIG.apiBase;
  if (!base) return "";
  const url = new URL(base);
  Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
  if (APP_CONFIG.token) {
    url.searchParams.set("token", APP_CONFIG.token);
  }
  return url.toString();
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

    // 只在 POST 且有 body 時才設定 headers 和 body
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

export const fetchLogs = async () => {
  const res = await request<Record<string, string>[]>({
    method: "GET",
    params: { action: "logs" }
  });
  if (!res.ok || !res.data) return { ok: res.ok, error: res.error };

  const mapped: TrainingLog[] = res.data.map((row, idx) => {
    const sets = [];
    for (let i = 1; i <= 4; i++) {
      const weight = row[`Set ${i} Weight (kg)`] ?? row[`set${i}Weight`] ?? "";
      const reps = row[`Set ${i} Reps`] ?? row[`set${i}Reps`] ?? "";
      if (weight || reps) {
        sets.push({ weight, reps });
      }
    }
    if (sets.length === 0) {
      sets.push({ weight: "", reps: "" });
    }

    return {
      id: row.id ?? String(idx),
      actionZh: row["動作名稱"] ?? row.actionZh ?? "",
      actionEn: row["Action Name"] ?? row.actionEn ?? "",
      targetMuscle: row["目標肌群"] ?? row.targetMuscle ?? "",
      lastDate: row["上次日期"] ?? row.lastDate ?? "",
      currentDate: row["本次日期"] ?? row.currentDate ?? "",
      sets,
      rpe: row["RPE"] ?? row.rpe ?? "",
      notes: row["備註"] ?? row.notes ?? "",
      nextTarget: row["下次目標"] ?? row.nextTarget ?? "",
      createdAt: row["建立時間"] ?? row.createdAt ?? ""
    };
  });

  return { ok: true, data: mapped };
};

export const createLog = (payload: TrainingLog) =>
  request<{ message: string }>({ method: "POST", body: payload, params: { action: "logs" } });

