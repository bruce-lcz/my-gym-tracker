import { useEffect, useMemo, useState } from "react";
import { createLog, fetchLogs } from "./api";
import { APP_CONFIG } from "./config";
import { TrainingLog, ReleaseNote, User } from "./types";
import { loadExercises, saveCustomExercise, Exercise } from "./exerciseData";
import { loadChangelog } from "./changelogParser";
import { MOCK_LOGS } from "./mockData";
import Dashboard from "./Dashboard";
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
  Save,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  Timer,
  Activity,
  Gauge
} from "lucide-react";

// 取得本地日期（台北時間）格式 YYYY-MM-DD
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const emptyLog: TrainingLog = {
  actionZh: "",
  actionEn: "",
  targetMuscle: "",
  lastDate: "",
  currentDate: getLocalDate(),
  sets: [
    { weight: "", reps: "" }
  ],
  rpe: "",
  notes: "",
  nextTarget: ""
};

function App() {
  const [activeTab, setActiveTab] = useState<"training" | "history" | "dashboard">("training");
  const [user, setUser] = useState<User>("Bruce");
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
  const [newExercise, setNewExercise] = useState<Exercise>({ zh: "", en: "", targetMuscle: "", type: "strength" });
  const [currentExerciseType, setCurrentExerciseType] = useState<"strength" | "cardio">("strength");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [releaseDrawerOpen, setReleaseDrawerOpen] = useState(false);

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

  // Release Notes 相關狀態（從 CHANGELOG.md 載入）
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);

  const disabled = useMemo(() => {
    return !form.actionZh || !form.currentDate;
  }, [form]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Sync User Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-user", user);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetchLogs(user);
      if (res.ok && res.data) {
        setLogs(res.data);
      } else {
        setError(res.error ?? "讀取失敗");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // 載入 CHANGELOG.md 版本紀錄
  useEffect(() => {
    loadChangelog().then(releases => {
      if (releases.length > 0) {
        setReleaseNotes(releases);
      }
    });
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const toggleUser = () => {
    setUser(prev => prev === "Bruce" ? "Linda" : "Bruce");
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  const [todayHistory, setTodayHistory] = useState<TrainingLog | null>(null);

  const handleExerciseSelect = (value: string) => {
    const selected = exercises.find(ex => ex.zh === value);
    if (selected) {
      const today = getLocalDate();
      const type = selected.type || "strength";
      setCurrentExerciseType(type);

      // Detect if we have done this exercise today
      const todayLog = logs.find(log =>
        log.actionZh === selected.zh && log.currentDate === today
      );
      setTodayHistory(todayLog || null);

      // Find the last record (excluding today to avoid confusion)
      const lastLog = logs
        .filter(log => log.actionZh === selected.zh && log.currentDate !== today)
        .sort((a, b) => (b.currentDate || "").localeCompare(a.currentDate || ""))[0];

      setForm(prev => ({
        ...prev,
        actionZh: selected.zh,
        actionEn: selected.en,
        targetMuscle: selected.targetMuscle,
        lastDate: lastLog?.currentDate || "",
        sets: [{ weight: "", reps: "", incline: "", speed: "", time: "" }] // Reset sets structure
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
    setCurrentExerciseType(newExercise.type || "strength");
    setNewExercise({ zh: "", en: "", targetMuscle: "", type: "strength" });
    setShowAddExercise(false);
    setMessage("已新增動作！");
  };

  const updateSet = (index: number, field: keyof typeof form.sets[0], value: string) => {
    setForm(prev => {
      const newSets = [...prev.sets];
      newSets[index] = { ...newSets[index], [field]: value };
      return { ...prev, sets: newSets };
    });
  };

  const addSet = () => {
    setForm(prev => ({
      ...prev,
      sets: [...prev.sets, { weight: "", reps: "", incline: "", speed: "", time: "" }]
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
    setSaving(true);

    // Prepare payload (Map Cardio fields to weight/reps for backend compatibility if needed)
    // Only if the fields are empty in weight/reps but present in speed/time
    const payload = { ...form };
    if (currentExerciseType === "cardio") {
      payload.sets = form.sets.map(s => ({
        ...s,
        // Map Cardio data to backend columns
        // Weight column <- "Spd: X / Inc: Y"
        weight: s.weight || `Spd:${s.speed || 0} Inc:${s.incline || 0}`,
        // Reps column <- "Time: Z min"
        reps: s.reps || `${s.time || 0} min`
      }));
    }

    const res = await createLog(user, payload);
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
        { weight: "", reps: "", incline: "", speed: "", time: "" }
      ]
    });
    setTodayHistory(null); // Clear local "today" visual state until refreshed
    const refresh = await fetchLogs(user);
    if (refresh.ok && refresh.data) setLogs(refresh.data);
  };

  return (
    <div className="app-container">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`mobile-sidebar-overlay ${mobileSidebarOpen ? "open" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileSidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-icon">
            <Dumbbell size={24} />
          </div>
          <button
            className="sidebar-toggle desktop-only"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "展開選單" : "收合選單"}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            className="sidebar-close mobile-only"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="關閉選單"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("dashboard");
              setMobileSidebarOpen(false);
            }}
            title="統計儀表板"
          >
            <BarChart3 size={20} />
            {!sidebarCollapsed && <span>統計儀表板</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-item"
            onClick={() => {
              setReleaseDrawerOpen(true);
              setMobileSidebarOpen(false);
            }}
            title="版本紀錄"
          >
            <FileText size={20} />
            {!sidebarCollapsed && <span>版本紀錄</span>}
          </button>
          <button
            className="sidebar-item theme-toggle-sidebar"
            onClick={() => {
              toggleUser();
              setMobileSidebarOpen(false);
            }}
            title={`切換使用者 (目前: ${user})`}
          >
            <Users size={20} />
            {!sidebarCollapsed && <span>{user}</span>}
          </button>
          <button
            className="sidebar-item theme-toggle-sidebar"
            onClick={() => {
              toggleTheme();
              setMobileSidebarOpen(false);
            }}
            title={theme === "light" ? "切換到深色模式" : "切換到淺色模式"}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            {!sidebarCollapsed && <span>{theme === "light" ? "深色模式" : "淺色模式"}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header>
          <div className="header-top">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="開啟選單"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1>GYM-TRACKER</h1>
              <p className="motivational-quote">{currentQuote}</p>
            </div>
          </div>
          {!APP_CONFIG.apiBase && (
            <p className="warn">尚未設定 API URL，請設定 .env 再重新整理</p>
          )}

          {/* Tab Navigation for Training & History */}
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
                      <label className="full">
                        類型
                        <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
                          <label style={{ flexDirection: "row", alignItems: "center", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="exerciseType"
                              checked={newExercise.type === "strength" || !newExercise.type}
                              onChange={() => setNewExercise(prev => ({ ...prev, type: "strength" }))}
                              style={{ width: "auto", margin: 0 }}
                            />
                            <Dumbbell size={16} /> 重量訓練
                          </label>
                          <label style={{ flexDirection: "row", alignItems: "center", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="exerciseType"
                              checked={newExercise.type === "cardio"}
                              onChange={() => setNewExercise(prev => ({ ...prev, type: "cardio" }))}
                              style={{ width: "auto", margin: 0 }}
                            />
                            <Activity size={16} /> 有氧運動
                          </label>
                        </div>
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

                {/* Show Today's History if exists */}
                {todayHistory && todayHistory.sets.length > 0 && (
                  <div className="today-history">
                    <h4 className="today-history-title">
                      <Calendar size={14} />
                      今日已完成組數 ({todayHistory.sets.length} 組)
                    </h4>
                    <div className="today-sets-list">
                      {todayHistory.sets.map((s, i) => (
                        <span key={i} className="today-set-badge">
                          Set {i + 1}: {s.weight}kg × {s.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {form.sets.map((set, idx) => {
                  const setNumber = (todayHistory?.sets.length || 0) + idx + 1;
                  return (
                    <div key={idx} className="set-row">
                      <span className="set-label">Set {setNumber}</span>

                      {currentExerciseType === "strength" ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <label>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Gauge size={14} /> 速度</span>
                            <input
                              type="number"
                              step="0.1"
                              value={set.speed}
                              onChange={e => updateSet(idx, "speed", e.target.value)}
                              placeholder="kph"
                            />
                          </label>
                          <label>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14} /> 坡度</span>
                            <input
                              type="number"
                              step="0.5"
                              value={set.incline}
                              onChange={e => updateSet(idx, "incline", e.target.value)}
                              placeholder="%"
                            />
                          </label>
                          <label>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Timer size={14} /> 時間</span>
                            <input
                              type="number"
                              value={set.time}
                              onChange={e => updateSet(idx, "time", e.target.value)}
                              placeholder="min"
                            />
                          </label>
                        </>
                      )}
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
                  );
                })}
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
                  <span>內容詳情</span>
                  <span>RPE</span>
                  <span>備註</span>
                  <span>下次目標</span>
                </div>
                {logs.map((row, idx) => {
                  // Determine display style based on content roughly
                  const isCardio = row.sets.some(s => s.weight.includes("Spd") || s.reps.includes("min"));

                  return (
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
                            .map((s, i) => {
                              if (isCardio) {
                                // Clean up the cardio display string
                                // Backend stores: Weight="Spd:6.5 Incline:2", Reps="30 min"
                                // We can display it cleanly.
                                return `${i + 1}. ${s.reps} (${s.weight})`;
                              }
                              return `${i + 1}. ${s.weight}kg×${s.reps}`;
                            })
                            .join(" | ")
                          : "-"}
                      </span>
                      <span data-label="RPE：">{row.rpe}</span>
                      <span className="notes-cell" data-label="備註：">{row.notes}</span>
                      <span data-label="下次目標：">{row.nextTarget}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <Dashboard
            user={user}
            logs={logs}
            onLoadDemoData={() => {
              setLogs(MOCK_LOGS);
              setMessage("已載入範例資料 (僅供瀏覽)");
              setTimeout(() => setMessage(null), 3000);
            }}
          />
        )}
      </div>

      {/* Release Notes Drawer */}
      <div className={`drawer-overlay ${releaseDrawerOpen ? "open" : ""}`} onClick={() => setReleaseDrawerOpen(false)} />
      <aside className={`drawer ${releaseDrawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h2><FileText size={22} /> 版本紀錄</h2>
          <button
            className="drawer-close"
            onClick={() => setReleaseDrawerOpen(false)}
            aria-label="關閉版本紀錄"
          >
            <X size={24} />
          </button>
        </div>
        <div className="drawer-content">
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
        </div>
      </aside>
    </div>
  );
}

export default App;

