import { useEffect, useMemo, useState } from "react";
import { createLog, fetchLogs } from "./api";
import { APP_CONFIG } from "./config";
import { TrainingLog } from "./types";
import { loadExercises, saveCustomExercise, Exercise } from "./exerciseData";

const emptyLog: TrainingLog = {
  actionZh: "",
  actionEn: "",
  targetMuscle: "",
  lastDate: "",
  currentDate: new Date().toISOString().slice(0, 10),
  sets: [
    { weight: "", reps: "" },
    { weight: "", reps: "" },
    { weight: "", reps: "" }
  ],
  rpe: "",
  notes: "",
  nextTarget: ""
};

function App() {
  const [form, setForm] = useState<TrainingLog>(emptyLog);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  );
  const [exercises, setExercises] = useState<Exercise[]>(() => loadExercises());
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExercise, setNewExercise] = useState<Exercise>({ zh: "", en: "", targetMuscle: "" });

  const disabled = useMemo(() => {
    return !form.actionZh || !form.currentDate;
  }, [form]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchLogs();
      if (res.ok && res.data) {
        setLogs(res.data);
      } else {
        setError(res.error ?? "讀取失敗");
      }
      setLoading(false);
    };
    load();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const handleExerciseSelect = (value: string) => {
    const selected = exercises.find(ex => ex.zh === value);
    if (selected) {
      // 找出這個動作的最近一次紀錄
      const lastLog = logs
        .filter(log => log.actionZh === selected.zh)
        .sort((a, b) => (b.currentDate || "").localeCompare(a.currentDate || ""))[0];

      setForm(prev => ({
        ...prev,
        actionZh: selected.zh,
        actionEn: selected.en,
        targetMuscle: selected.targetMuscle,
        lastDate: lastLog?.currentDate || ""
      }));
    }
  };

  const handleAddExercise = () => {
    if (!newExercise.zh.trim()) {
      setError("請至少填寫動作中文名稱");
      return;
    }
    saveCustomExercise(newExercise);
    setExercises(loadExercises());
    setForm(prev => ({
      ...prev,
      actionZh: newExercise.zh,
      actionEn: newExercise.en,
      targetMuscle: newExercise.targetMuscle
    }));
    setNewExercise({ zh: "", en: "", targetMuscle: "" });
    setShowAddExercise(false);
    setMessage("已新增動作！");
  };

  const updateSet = (index: number, field: "weight" | "reps", value: string) => {
    setForm(prev => {
      const newSets = [...prev.sets];
      newSets[index] = { ...newSets[index], [field]: value };
      return { ...prev, sets: newSets };
    });
  };

  const addSet = () => {
    setForm(prev => ({
      ...prev,
      sets: [...prev.sets, { weight: "", reps: "" }]
    }));
  };

  const removeSet = (index: number) => {
    if (form.sets.length <= 1) return;
    setForm(prev => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== index)
    }));
  };

  const onChange = (key: keyof TrainingLog, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    const res = await createLog(form);
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "送出失敗");
      return;
    }
    setMessage("已儲存");
    setForm({
      ...emptyLog,
      currentDate: form.currentDate,
      sets: [
        { weight: "", reps: "" },
        { weight: "", reps: "" },
        { weight: "", reps: "" }
      ]
    });
    const refresh = await fetchLogs();
    if (refresh.ok && refresh.data) setLogs(refresh.data);
  };

  return (
    <div className="page">
      <header>
        <div className="header-top">
          <div>
            <h1>健身紀錄</h1>
            <p>資料儲存在 Google Sheet（Apps Script Web App API）</p>
          </div>
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="切換主題">
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
        {!APP_CONFIG.apiBase && (
          <p className="warn">尚未設定 API URL，請設定 .env 再重新整理</p>
        )}
      </header>

      <section className="card">
        <h2>新增 / 更新紀錄</h2>
        <form onSubmit={handleSubmit} className="grid">
          <label>
            動作名稱
            <div className="select-wrapper">
              <select
                value={form.actionZh}
                onChange={e => handleExerciseSelect(e.target.value)}
                required
              >
                <option value="">-- 選擇動作 --</option>
                {exercises.map((ex, idx) => (
                  <option key={idx} value={ex.zh}>
                    {ex.zh} {ex.en ? `/ ${ex.en}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label>
            <span style={{ opacity: 0.6 }}>目標肌群（自動填入）</span>
            <input
              value={form.targetMuscle}
              readOnly
              placeholder="選擇動作後自動填入"
              style={{ cursor: "not-allowed", opacity: 0.7 }}
            />
          </label>
          <div className="add-exercise-btn-wrapper">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAddExercise(!showAddExercise)}
            >
              {showAddExercise ? "取消新增" : "+ 新增自訂動作"}
            </button>
          </div>
          {showAddExercise && (
            <>
              <div className="full add-exercise-form">
                <h3>新增自訂動作</h3>
                <div className="grid">
                  <label>
                    動作名稱 (中文) *
                    <input
                      value={newExercise.zh}
                      onChange={e => setNewExercise(prev => ({ ...prev, zh: e.target.value }))}
                      placeholder="如：啞鈴飛鳥"
                    />
                  </label>
                  <label>
                    動作名稱 (英文)
                    <input
                      value={newExercise.en}
                      onChange={e => setNewExercise(prev => ({ ...prev, en: e.target.value }))}
                      placeholder="如：Dumbbell Fly"
                    />
                  </label>
                  <label>
                    目標肌群
                    <input
                      value={newExercise.targetMuscle}
                      onChange={e => setNewExercise(prev => ({ ...prev, targetMuscle: e.target.value }))}
                      placeholder="如：胸大肌"
                    />
                  </label>
                  <div className="add-exercise-actions">
                    <button type="button" onClick={handleAddExercise} className="btn-primary">
                      ✓ 確認新增
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {form.lastDate && (
            <div className="last-record-info">
              <span className="info-label">📅 上次訓練：</span>
              <span className="info-value">{form.lastDate}</span>
            </div>
          )}
          <label>
            訓練日期
            <input
              type="date"
              value={form.currentDate}
              onChange={e => onChange("currentDate", e.target.value)}
              required
            />
          </label>

          <div className="full sets-section">
            <h3>訓練組數</h3>
            {form.sets.map((set, idx) => (
              <div key={idx} className="set-row">
                <span className="set-label">Set {idx + 1}</span>
                <label>
                  重量 (kg)
                  <input
                    type="number"
                    step="0.5"
                    value={set.weight}
                    onChange={e => updateSet(idx, "weight", e.target.value)}
                    placeholder="80"
                  />
                </label>
                <label>
                  次數 (reps)
                  <input
                    type="number"
                    value={set.reps}
                    onChange={e => updateSet(idx, "reps", e.target.value)}
                    placeholder="10"
                  />
                </label>
                {form.sets.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeSet(idx)}
                    aria-label="移除此組"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addSet}>
              + 新增組數
            </button>
          </div>
          <label>
            RPE (強度 1-10)
            <input
              type="number"
              min="1"
              max="10"
              step="0.5"
              value={form.rpe}
              onChange={e => onChange("rpe", e.target.value)}
              placeholder="8"
            />
          </label>
          <label className="full">
            備註
            <textarea
              value={form.notes}
              onChange={e => onChange("notes", e.target.value)}
              placeholder="今天狀態不錯 / 肩膀有點痠..."
              rows={2}
            />
          </label>
          <label className="full">
            下次目標
            <input value={form.nextTarget} onChange={e => onChange("nextTarget", e.target.value)} />
          </label>

          <div className="actions full">
            <button type="submit" disabled={disabled || saving}>
              {saving ? "儲存中..." : "儲存"}
            </button>
            {error && <span className="error">{error}</span>}
            {message && <span className="ok">{message}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h2>最近紀錄</h2>
        {loading ? (
          <p>讀取中...</p>
        ) : logs.length === 0 ? (
          <p>目前沒有紀錄</p>
        ) : (
          <div className="table">
            <div className="table-head">
              <span>日期</span>
              <span>動作</span>
              <span>組數詳情</span>
              <span>RPE</span>
              <span>備註</span>
              <span>下次目標</span>
            </div>
            {logs.map((row, idx) => (
              <div className="table-row" key={row.id ?? idx}>
                <span>{row.currentDate}</span>
                <span>
                  {row.actionZh}
                  {row.actionEn ? ` / ${row.actionEn}` : ""}
                </span>
                <span className="sets-display">
                  {row.sets && row.sets.length > 0
                    ? row.sets
                        .filter(s => s.weight || s.reps)
                        .map((s, i) => `${i + 1}. ${s.weight}kg×${s.reps}`)
                        .join(" | ")
                    : "-"}
                </span>
                <span>{row.rpe}</span>
                <span className="notes-cell">{row.notes}</span>
                <span>{row.nextTarget}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

