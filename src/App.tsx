import { useEffect, useMemo, useState } from "react";
import { createLog, fetchLogs } from "./api";
import { APP_CONFIG } from "./config";
import { TrainingLog, ReleaseNote } from "./types";
import { loadExercises, saveCustomExercise, Exercise } from "./exerciseData";
import { 
  Dumbbell, 
  History, 
  FileText, 
  Moon, 
  Sun, 
  Plus, 
  Trash2, 
  Check,
  Calendar,
  TrendingUp,
  Edit,
  Save
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"training" | "history" | "releases">("training");
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
  
  // 勵志語錄
  const motivationalQuotes = [
    "💪 今天的汗水，是明天的成就！",
    "🔥 每一次訓練，都是在雕刻更好的自己",
    "⚡ 堅持不懈，必有收穫",
    "🏆 你的身體會感謝你今天的努力",
    "💯 進步不是一蹴而就，而是日積月累",
    "🚀 突破極限，超越昨天的自己",
    "💎 每一滴汗水都值得",
    "🌟 強者不是沒有軟弱，而是能夠征服軟弱",
    "🎯 專注當下，成就未來",
    "⭐ 你比你想像的更強大"
  ];
  const [currentQuote] = useState(() => 
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );
  
  // Release Notes 相關狀態
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>(() => {
    // 定義當前的版本歷史（這是程式碼中的最新版本）
    const currentReleases: ReleaseNote[] = [
      {
        id: "1",
        version: "v1.1.0",
        date: new Date().toISOString().slice(0, 10),
        title: "圖標系統升級與版本資訊功能",
        type: "feature",
        changes: [
          "整合 Lucide React 圖標庫，提供更美觀的視覺體驗",
          "新增 Tab 導航系統，分離新增訓練、訓練紀錄和版本資訊",
          "優化所有按鈕設計，加入對應的圖標提升使用體驗",
          "新增勵志語錄系統，每次開啟隨機顯示激勵文字",
          "新增版本資訊頁面，展示應用功能與更新歷史"
        ]
      },
      {
        id: "0",
        version: "v1.0.0",
        date: "2025-12-17",
        title: "健身追蹤器首次發布",
        type: "feature",
        changes: [
          "基本訓練記錄功能 - 記錄動作、組數、重量、RPE",
          "訓練歷史查詢 - 查看所有歷史訓練記錄",
          "Google Sheets 整合 - 雲端同步訓練數據",
          "深色/淺色主題切換 - 根據喜好自訂介面",
          "自訂動作功能 - 可新增個人化的訓練動作",
          "響應式設計 - 完美支援手機、平板、桌面裝置"
        ]
      }
    ];
    
    const saved = localStorage.getItem("releaseNotes");
    
    // 如果沒有儲存的資料，直接使用當前版本
    if (!saved) {
      localStorage.setItem("releaseNotes", JSON.stringify(currentReleases));
      return currentReleases;
    }
    
    // 檢查儲存的版本是否與當前版本一致
    const savedReleases: ReleaseNote[] = JSON.parse(saved);
    const latestSavedVersion = savedReleases[0]?.version || "";
    const latestCurrentVersion = currentReleases[0]?.version || "";
    
    // 如果版本號不同，或者內容長度不同，表示有更新，使用當前版本並合併用戶新增的版本
    if (latestSavedVersion !== latestCurrentVersion || 
        savedReleases.length < currentReleases.length ||
        JSON.stringify(savedReleases.find(r => r.id === "1")) !== JSON.stringify(currentReleases[0])) {
      
      // 保留用戶自己新增的版本紀錄（id 不在預設版本中的）
      const defaultIds = currentReleases.map(r => r.id);
      const userAddedReleases = savedReleases.filter(r => !defaultIds.includes(r.id));
      
      // 合併：用戶新增的版本 + 當前預設版本
      const mergedReleases = [...userAddedReleases, ...currentReleases];
      localStorage.setItem("releaseNotes", JSON.stringify(mergedReleases));
      return mergedReleases;
    }
    
    // 版本一致，使用儲存的資料
    return savedReleases;
  });
  const [showAddRelease, setShowAddRelease] = useState(false);
  const [newRelease, setNewRelease] = useState<Omit<ReleaseNote, "id">>({
    version: "",
    date: new Date().toISOString().slice(0, 10),
    title: "",
    changes: [""],
    type: "feature"
  });

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

  // Release Notes 處理函數
  const handleAddRelease = () => {
    if (!newRelease.version.trim() || !newRelease.title.trim()) {
      setError("請填寫版本號和標題");
      return;
    }
    const release: ReleaseNote = {
      id: Date.now().toString(),
      ...newRelease,
      changes: newRelease.changes.filter(c => c.trim() !== "")
    };
    const updated = [release, ...releaseNotes];
    setReleaseNotes(updated);
    localStorage.setItem("releaseNotes", JSON.stringify(updated));
    setNewRelease({
      version: "",
      date: new Date().toISOString().slice(0, 10),
      title: "",
      changes: [""],
      type: "feature"
    });
    setShowAddRelease(false);
    setMessage("已新增版本紀錄！");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteRelease = (id: string) => {
    const updated = releaseNotes.filter(r => r.id !== id);
    setReleaseNotes(updated);
    localStorage.setItem("releaseNotes", JSON.stringify(updated));
    setMessage("已刪除版本紀錄");
    setTimeout(() => setMessage(null), 3000);
  };

  const updateReleaseChange = (index: number, value: string) => {
    const changes = [...newRelease.changes];
    changes[index] = value;
    setNewRelease({ ...newRelease, changes });
  };

  const addReleaseChange = () => {
    setNewRelease({ ...newRelease, changes: [...newRelease.changes, ""] });
  };

  const removeReleaseChange = (index: number) => {
    if (newRelease.changes.length <= 1) return;
    const changes = newRelease.changes.filter((_, i) => i !== index);
    setNewRelease({ ...newRelease, changes });
  };

  return (
    <div className="page">
      <header>
        <div className="header-top">
          <div>
            <h1><Dumbbell className="header-icon" /> 健身紀錄</h1>
            <p className="motivational-quote">{currentQuote}</p>
          </div>
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="切換主題">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        {!APP_CONFIG.apiBase && (
          <p className="warn">尚未設定 API URL，請設定 .env 再重新整理</p>
        )}
        
        {/* Tab Navigation */}
        <nav className="tabs">
          <button 
            className={`tab ${activeTab === "training" ? "active" : ""}`}
            onClick={() => setActiveTab("training")}
          >
            <TrendingUp size={18} />
            <span>新增訓練</span>
          </button>
          <button 
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <History size={18} />
            <span>訓練紀錄</span>
          </button>
          <button 
            className={`tab ${activeTab === "releases" ? "active" : ""}`}
            onClick={() => setActiveTab("releases")}
          >
            <FileText size={18} />
            <span>目前版本</span>
          </button>
        </nav>
      </header>

      {/* Training Form Tab */}
      {activeTab === "training" && (
        <section className="card">
          <h2><Edit size={22} className="section-icon" /> 新增 / 更新紀錄</h2>
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
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              {showAddExercise ? <Trash2 size={16} /> : <Plus size={16} />}
              {showAddExercise ? "取消新增" : "新增自訂動作"}
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
                    <button type="button" onClick={handleAddExercise} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Check size={16} />
                      確認新增
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {form.lastDate && (
            <div className="last-record-info">
              <Calendar size={16} style={{ marginRight: "4px" }} />
              <span className="info-label">上次訓練：</span>
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
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={addSet} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={16} />
              新增組數
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
              <Save size={18} style={{ marginRight: "6px" }} />
              {saving ? "儲存中..." : "儲存"}
            </button>
            {error && <span className="error">{error}</span>}
            {message && <span className="ok">{message}</span>}
          </div>
        </form>
      </section>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <section className="card">
          <h2><History size={22} className="section-icon" /> 最近紀錄</h2>
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
                <span data-label="日期：">{row.currentDate}</span>
                <span data-label="動作：">
                  {row.actionZh}
                  {row.actionEn ? ` / ${row.actionEn}` : ""}
                </span>
                <span className="sets-display" data-label="組數：">
                  {row.sets && row.sets.length > 0
                    ? row.sets
                        .filter(s => s.weight || s.reps)
                        .map((s, i) => `${i + 1}. ${s.weight}kg×${s.reps}`)
                        .join(" | ")
                    : "-"}
                </span>
                <span data-label="RPE：">{row.rpe}</span>
                <span className="notes-cell" data-label="備註：">{row.notes}</span>
                <span data-label="下次目標：">{row.nextTarget}</span>
              </div>
            ))}
          </div>
        )}
        </section>
      )}

      {/* Release Notes Tab */}
      {activeTab === "releases" && (
        <section className="card">
          <h2><FileText size={22} className="section-icon" /> 目前版本</h2>
          
          {releaseNotes.length === 0 ? (
            <p>目前沒有版本紀錄</p>
          ) : (
            <div className="releases-list">
              {releaseNotes.map((release, index) => (
                <div key={release.id} className="release-item">
                  <div className="release-header">
                    <div>
                      <span className={`release-badge ${release.type}`}>
                        {index === 0 ? (
                          "✨ 當前版本"
                        ) : (
                          <>
                            {release.type === "feature" && "📦 歷史版本"}
                            {release.type === "fix" && "🐛 錯誤修復"}
                            {release.type === "improvement" && "⚡ 功能優化"}
                            {release.type === "breaking" && "💥 重大變更"}
                          </>
                        )}
                      </span>
                      <h3>{release.version}</h3>
                      <p className="release-title">{release.title}</p>
                    </div>
                    <div className="release-actions">
                      <span className="release-date">
                        <Calendar size={14} />
                        {release.date}
                      </span>
                    </div>
                  </div>
                  {release.changes.length > 0 && (
                    <ul className="release-changes">
                      {release.changes.map((change, idx) => (
                        <li key={idx}>{change}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;

