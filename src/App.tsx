import { useEffect, useMemo, useState } from "react";
import { createLog, fetchLogs } from "./api";
import { APP_CONFIG } from "./config";
import { TrainingLog, ReleaseNote, User, PlanItem } from "./types";
import { loadExercises, saveCustomExercise, Exercise, fetchExercisesFromSheet } from "./exerciseData";
import { translateExercise } from "./llmService";
import { loadChangelog } from "./changelogParser";
import { MOCK_LOGS } from "./mockData";
import Dashboard from "./Dashboard";
import AICoach from "./AICoach";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";
import WorkoutMenu from "./components/WorkoutMenu";
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
  Gauge,
  Sparkles,
  Database,
  ClipboardList
} from "lucide-react";
import ExerciseSelector from "./components/ExerciseSelector";
import WeeklySummary from "./components/WeeklySummary";
import LastWorkoutReference from "./components/LastWorkoutReference";
import ExerciseManager from "./components/ExerciseManager";

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

function AppContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"training" | "menu" | "history" | "dashboard" | "ai-coach" | "exercises">("training");
  const [user, setUser] = useState<User>(currentUser || "Bruce");
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
  const [translating, setTranslating] = useState(false);
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
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() =>
    Math.floor(Math.random() * motivationalQuotes.length)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % motivationalQuotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [motivationalQuotes.length]);

  // Release Notes 相關狀態（從 CHANGELOG.md 載入）
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);

  const disabled = useMemo(() => {
    return !form.actionZh || !form.currentDate;
  }, [form]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: TrainingLog[] } = {};
    logs.forEach(log => {
      const date = log.currentDate || "Unknown Date";
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });

    // Return sorted groups (Newest date first)
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({
        date,
        items
      }));
  }, [logs]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Sync User Theme and initialize user from auth
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
  }, [currentUser]);

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

  // 載入動作資料從 Google Sheets
  useEffect(() => {
    const loadExercisesData = async () => {
      const exercisesData = await fetchExercisesFromSheet();
      setExercises(exercisesData);
    };
    loadExercisesData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  const handleClearLocalStorage = () => {
    if (window.confirm("確定要清空所有本地暫存資料嗎？這將清除主題設定、側邊欄狀態等本地資料，並重新載入頁面。")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const [todayHistory, setTodayHistory] = useState<TrainingLog | null>(null);
  const [lastWorkoutDetails, setLastWorkoutDetails] = useState<TrainingLog | null>(null);

  const handleExerciseSelect = (value: string) => {
    const selected = exercises.find(ex => ex.zh === value);
    if (selected) {
      const today = getLocalDate();
      // Normalize type to lowercase for consistent comparison
      const rawType = selected.type?.toLowerCase() || "strength";
      const type: "strength" | "cardio" = rawType === "cardio" ? "cardio" : "strength";

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

      // Store full last workout details for reference panel
      setLastWorkoutDetails(lastLog || null);

      // Calculate average weight from last workout for auto-fill
      let autoFillWeight = "";
      if (lastLog && lastLog.sets.length > 0 && type === "strength") {
        const validSets = lastLog.sets.filter(s => parseFloat(s.weight || "0") > 0);

        if (validSets.length > 0) {
          if (validSets.length >= 2) {
            autoFillWeight = validSets[validSets.length - 2].weight;
          } else {
            autoFillWeight = validSets[0].weight;
          }
        }
      }

      setForm(prev => ({
        ...prev,
        actionZh: selected.zh,
        actionEn: selected.en,
        targetMuscle: selected.targetMuscle,
        lastDate: lastLog?.currentDate || "",
        sets: [{ weight: autoFillWeight, reps: "", incline: "", speed: "", time: "" }] // Auto-fill weight
      }));
    }
  };

  const handleTranslateExercise = async () => {
    if (!newExercise.en.trim()) {
      setError("請輸入英文動作名稱");
      return;
    }

    setTranslating(true);
    setError(null);

    const result = await translateExercise(newExercise.en);
    setTranslating(false);

    if (!result.ok) {
      setError(result.error || "翻譯失敗");
      return;
    }

    if (result.data) {
      setNewExercise(prev => ({
        ...prev,
        zh: result.data!.chineseName,
        targetMuscle: result.data!.targetMuscle
      }));
      setMessage("已自動生成中文名稱和訓練肌群！");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAddExercise = async () => {
    if (!newExercise.zh.trim()) {
      setError("請填寫動作中文名稱");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await saveCustomExercise(newExercise);

    if (!result.ok) {
      setError(result.error || "新增動作失敗");
      setSaving(false);
      return;
    }

    // Reload exercises from backend to get the latest list
    const exercisesData = await fetchExercisesFromSheet();
    setExercises(exercisesData);

    setForm(prev => ({
      ...prev,
      actionZh: newExercise.zh,
      actionEn: newExercise.en,
      targetMuscle: newExercise.targetMuscle
    }));
    setCurrentExerciseType(newExercise.type || "strength");
    setNewExercise({ zh: "", en: "", targetMuscle: "", type: "strength" });
    setShowAddExercise(false);
    setMessage("已新增動作並同步至 Google Sheets！");
    setSaving(false);
  };

  const updateSet = (index: number, field: keyof typeof form.sets[0], value: string) => {
    setForm(prev => {
      const newSets = [...prev.sets];
      newSets[index] = { ...newSets[index], [field]: value };
      return { ...prev, sets: newSets };
    });
  };

  // Handler for applying weight from last workout reference
  const handleApplyWeight = (weight: string) => {
    setForm(prev => ({
      ...prev,
      sets: prev.sets.map(set => ({ ...set, weight }))
    }));
  };

  // Handler for incrementing weight from last workout reference
  const handleIncrementWeight = (increment: number) => {
    if (!lastWorkoutDetails || lastWorkoutDetails.sets.length === 0) return;

    const validSets = lastWorkoutDetails.sets.filter(s => parseFloat(s.weight || "0") > 0);

    if (validSets.length > 0) {
      let baseWeight = 0;
      if (validSets.length >= 2) {
        baseWeight = parseFloat(validSets[validSets.length - 2].weight);
      } else {
        baseWeight = parseFloat(validSets[0].weight);
      }

      const newWeight = (baseWeight + increment).toFixed(1);
      handleApplyWeight(newWeight);
    }
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

  // Fitness Menu (Daily Plan) State
  const [dailyPlan, setDailyPlan] = useState<PlanItem[]>(() => {
    const saved = localStorage.getItem("dailyPlan");
    return saved ? JSON.parse(saved) : [];
  });
  // showImportPlan, importJson removed - handled in WorkoutMenu
  const [planCompletedItems, setPlanCompletedItems] = useState<string[]>([]);

  // Check which items are completed based on today's logs
  useEffect(() => {
    const today = getLocalDate();
    const completed = logs
      .filter(log => log.currentDate === today)
      .map(log => log.actionZh);
    setPlanCompletedItems(completed);
  }, [logs]);

  // handleImportPlan removed - handled in WorkoutMenu

  const handleUsePlanItem = (item: PlanItem) => {
    // Clean up input action name (trim spaces)
    const rawAction = item.action.trim();

    // Helper to normalize strings for comparison (remove spaces, lowercase)
    const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();
    const target = normalize(rawAction);

    // 1. Try to find the exercise in our list
    // Priority: 
    // 1. Exact or Normalized match on key fields (zh, en)
    // 2. Normalized match on "zh/en" combination (common user mistake coping from UI)
    const foundExercise = exercises.find(ex => {
      const z = normalize(ex.zh || "");
      const e = normalize(ex.en || "");

      // Check individual fields
      if (z === target || e === target) return true;
      if (ex.zh === rawAction || ex.en === rawAction) return true;

      // Check composite format "ZH/EN" or "ZH (EN)" etc
      // Does the user input contain the ZH name?
      if (ex.zh && rawAction.includes(ex.zh)) return true;
      // Does the user input contain the EN name (if EN is long enough to be unique > 3 chars)?
      if (ex.en && ex.en.length > 3 && rawAction.toLowerCase().includes(ex.en.toLowerCase())) return true;

      return false;
    });

    // 2. Prepare Form Data
    let targetMuscle = "";
    let actionEn = "";
    let lastDate = "";

    // IMPORTANT: precise match for Select value
    // If we found a gym-tracker exercise object, we MUST use its existing `zh` value exactly.
    // Otherwise the <select> won't pick it up.
    let exerciseName = foundExercise ? foundExercise.zh : rawAction;

    // Alert if not found
    if (!foundExercise) {
      // Double check existence in case of weird edge cases
      const existsInDropdown = exercises.some(ex => ex.zh === exerciseName);
      if (!existsInDropdown) {
        alert(
          `無法載入動作：${rawAction}\n\n` +
          `系統找不到對應的動作資料，請確認該動作是否存在於您的動作列表中。\n` +
          `提示：若是自訂動作，請確保名稱完全一致。`
        );
      }
    }

    // 3. Update Exercise Context (Type, History)
    let lastLog: TrainingLog | undefined;
    if (foundExercise) {
      const today = getLocalDate();
      const rawType = foundExercise.type?.toLowerCase() || "strength";
      const type: "strength" | "cardio" = rawType === "cardio" ? "cardio" : "strength";

      setCurrentExerciseType(type);

      const todayLog = logs.find(log =>
        log.actionZh === foundExercise.zh && log.currentDate === today
      );
      setTodayHistory(todayLog || null);

      lastLog = logs
        .filter(log => log.actionZh === foundExercise.zh && log.currentDate !== today)
        .sort((a, b) => (b.currentDate || "").localeCompare(a.currentDate || ""))[0];

      // Store full last workout details for reference panel
      setLastWorkoutDetails(lastLog || null);

      targetMuscle = foundExercise.targetMuscle || "";
      actionEn = foundExercise.en || "";
      lastDate = lastLog?.currentDate || "";
    } else {
      // Fallback
      setCurrentExerciseType("strength");
      setTodayHistory(null);
      setLastWorkoutDetails(null);
    }

    // 4. Create 'sets' array based on plan
    // Smart weight filling: Use plan weight if provided, otherwise use 2nd to last set weight
    let smartWeight = item.weight || "";

    // If no weight in plan but we have last workout data, use 2nd to last set weight
    if (!smartWeight && lastLog && lastLog.sets.length > 0) {
      const validSets = lastLog.sets.filter(s => parseFloat(s.weight || "0") > 0);

      if (validSets.length > 0) {
        if (validSets.length >= 2) {
          smartWeight = validSets[validSets.length - 2].weight;
        } else {
          smartWeight = validSets[0].weight;
        }
      }
    }

    const newSets = Array.from({ length: item.sets }).map(() => ({
      weight: smartWeight,
      reps: item.reps,
      incline: "", speed: "", time: ""
    }));

    // 5. Update Form State in one go
    setForm(prev => ({
      ...prev,
      actionZh: exerciseName,
      actionEn: actionEn,
      targetMuscle: targetMuscle,
      lastDate: lastDate,
      sets: newSets
    }));

    // 6. Switch to training tab
    setActiveTab("training");

    // Debug info
    console.log("Loaded Plan Item:", { rawAction, match: foundExercise?.zh, sets: newSets, smartWeight });
  };

  // ----------------------------------------------------------------

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
          <button
            className={`sidebar-item ${activeTab === "ai-coach" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("ai-coach");
              setMobileSidebarOpen(false);
            }}
            title="AI 助理教練"
          >
            <Sparkles size={20} />
            {!sidebarCollapsed && <span>AI 助理教練</span>}
          </button>
          <button
            className={`sidebar-item ${activeTab === "exercises" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("exercises");
              setMobileSidebarOpen(false);
            }}
            title="動作管理"
          >
            <Dumbbell size={20} />
            {!sidebarCollapsed && <span>動作管理</span>}
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
          <div className="sidebar-item user-display" title={`目前使用者: ${user}`}>
            <Users size={20} />
            {!sidebarCollapsed && <span>{user}</span>}
          </div>
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
          <button
            className="sidebar-item clear-storage-btn"
            onClick={() => {
              handleClearLocalStorage();
              setMobileSidebarOpen(false);
            }}
            title="清空本地暫存資料"
          >
            <Database size={20} />
            {!sidebarCollapsed && <span>清空本地資料</span>}
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
              <p key={currentQuoteIndex} className="motivational-quote">
                {motivationalQuotes[currentQuoteIndex]}
              </p>
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
              className={`tab ${activeTab === "menu" ? "active" : ""}`}
              onClick={() => setActiveTab("menu")}
            >
              <ClipboardList size={18} />
              <span>今日菜單</span>
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

        {/* Daily Plan Tab */}
        {activeTab === "menu" && (
          <WorkoutMenu
            dailyPlan={dailyPlan}
            setDailyPlan={setDailyPlan}
            onUsePlanItem={handleUsePlanItem}
            planCompletedItems={planCompletedItems}
            exercises={exercises}
          />
        )}

        {/* Training Form Tab */}
        {activeTab === "training" && (
          <section className="card">
            <h2><Edit size={22} className="section-icon" /> 新增 / 更新紀錄</h2>
            <form onSubmit={handleSubmit} className="grid">
              <div className="form-row">
                <label className="exercise-group">
                  動作名稱
                  <div className="select-wrapper-custom" style={{ marginTop: "4px" }}>
                    <ExerciseSelector
                      exercises={exercises}
                      value={form.actionZh}
                      onChange={handleExerciseSelect}
                    />
                  </div>
                </label>
                <label className="muscle-group">
                  <span style={{ opacity: 0.6 }}>目標肌群（自動填入）</span>
                  <input
                    value={form.targetMuscle}
                    readOnly
                    placeholder="選擇動作後自動填入"
                    style={{ cursor: "not-allowed", opacity: 0.7 }}
                  />
                </label>
                <div className="add-btn-group">
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
              </div>
              {showAddExercise && (
                <>
                  <div className="full add-exercise-form">
                    <h3>新增自訂動作</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                      💡 只需輸入英文動作名稱，點擊「AI 生成」即可自動生成中文名稱和訓練肌群
                    </p>
                    <div className="grid">
                      <label>
                        動作名稱 (英文) *
                        <input
                          value={newExercise.en}
                          onChange={e => setNewExercise(prev => ({ ...prev, en: e.target.value }))}
                          placeholder="如：Dumbbell Fly"
                        />
                      </label>
                      <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button
                          type="button"
                          onClick={handleTranslateExercise}
                          disabled={translating || !newExercise.en.trim()}
                          className="btn-secondary"
                          style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}
                        >
                          {translating ? (
                            <>
                              <span className="spin-animation">🔄</span>
                              生成中...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              AI 生成
                            </>
                          )}
                        </button>
                      </div>
                      <label>
                        動作名稱 (中文) *
                        <input
                          value={newExercise.zh}
                          onChange={e => setNewExercise(prev => ({ ...prev, zh: e.target.value }))}
                          placeholder="如：啞鈴飛鳥"
                          style={{ background: newExercise.zh ? "var(--primary-bg-subtle)" : "var(--input-bg)" }}
                        />
                      </label>
                      <label>
                        目標肌群
                        <input
                          value={newExercise.targetMuscle}
                          onChange={e => setNewExercise(prev => ({ ...prev, targetMuscle: e.target.value }))}
                          placeholder="如：胸大肌"
                          style={{ background: newExercise.targetMuscle ? "var(--primary-bg-subtle)" : "var(--input-bg)" }}
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
                        <button type="button" onClick={handleAddExercise} disabled={saving || !newExercise.zh.trim()} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={16} />
                          {saving ? "儲存中..." : "確認新增"}
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

              {/* Last Workout Reference Panel - Only show for strength exercises */}
              {currentExerciseType === "strength" && lastWorkoutDetails && (
                <div className="full">
                  <LastWorkoutReference
                    lastWorkout={lastWorkoutDetails}
                    onApplyWeight={handleApplyWeight}
                    onIncrementWeight={handleIncrementWeight}
                  />
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
                      {[...todayHistory.sets].reverse().map((s, i) => (
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
            <WeeklySummary
              user={user}
              logs={logs}
              primaryColor={user === "Linda" ? "#8D6E63" : "#2E8B57"}
            />
            {loading ? (
              <p>讀取中...</p>
            ) : logs.length === 0 ? (
              <p>目前沒有紀錄</p>
            ) : (
              <div className="history-list">
                {groupedLogs.map((group) => (
                  <div key={group.date} className="history-date-group">
                    <div className="history-date-header">
                      <Calendar size={18} />
                      <span>{group.date}</span>
                    </div>
                    <div className="history-items-container">
                      {group.items.map((row, idx) => {
                        const isCardio = row.sets.some(s => String(s.weight || '').includes("Spd") || String(s.reps || '').includes("min"));

                        return (
                          <div className="history-card" key={row.id ?? idx}>
                            <div className="history-card-header">
                              <span className="history-action-name">
                                {row.actionZh}
                                {row.actionEn && <span className="en-name"> {row.actionEn}</span>}
                              </span>
                              {row.rpe && <span className="history-rpe">RPE: {row.rpe}</span>}
                            </div>

                            <div className="history-card-content">
                              <div className="history-sets">
                                {row.sets && row.sets.length > 0 ? (
                                  <div className="sets-list">
                                    {row.sets
                                      .filter(s => s.weight || s.reps)
                                      .map((s, i) => {
                                        if (isCardio) {
                                          return (
                                            <div key={i} className="set-item">
                                              <span className="set-tag">#{i + 1}</span>
                                              <span className="set-val">{s.reps} ({s.weight})</span>
                                            </div>
                                          );
                                        }
                                        return (
                                          <div key={i} className="set-item">
                                            <span className="set-tag">#{i + 1}</span>
                                            <span className="set-val">{s.weight}kg × {s.reps}</span>
                                          </div>
                                        );
                                      })}
                                  </div>
                                ) : (
                                  <span className="no-sets">-</span>
                                )}
                              </div>

                              {(row.notes || row.nextTarget) && (
                                <div className="history-footer">
                                  {row.notes && (
                                    <div className="history-note">
                                      <span className="label">備註:</span> {row.notes}
                                    </div>
                                  )}
                                  {row.nextTarget && (
                                    <div className="history-target">
                                      <span className="label">目標:</span> {row.nextTarget}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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

        {/* AI Coach Tab */}
        {activeTab === "ai-coach" && (
          <AICoach
            user={user}
            logs={logs}
          />
        )}

        {/* Exercise Manager Tab */}
        {activeTab === "exercises" && (
          <ExerciseManager />
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

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AppContent />;
}

function WrappedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default WrappedApp;

