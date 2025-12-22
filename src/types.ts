export type User = "Bruce" | "Linda";

export type SetData = {
  weight: string;
  reps: string;
};

// Frontend logical unit (Session or Action Group)
export type TrainingLog = {
  id?: string;
  actionZh: string;
  actionEn?: string;
  targetMuscle: string;
  lastDate?: string;
  currentDate: string;
  sets: SetData[];
  rpe?: string;
  notes?: string;
  nextTarget?: string;
  createdAt?: string;
};

// Backend raw row
export type RawLog = {
  id: string;
  date: string;
  actionZh: string;
  actionEn: string;
  targetMuscle: string;
  weight: string;
  reps: string;
  rpe: string;
  notes: string;
  nextTarget: string;
  createdAt: string;
};

export type ReleaseNote = {
  id: string;
  version: string;
  date: string;
  title: string;
  changes: string[];
  type: "feature" | "fix" | "improvement" | "breaking";
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

