import { useState, useEffect } from "react";
import { PlanItem, WorkoutPackage } from "../types";
import { Exercise } from "../exerciseData";
import {
    ClipboardList,
    Check,
    Plus,
    Trash2,
    Save,
    Dumbbell,
    Play,
    Package,
    X,
    ChevronDown,
    ChevronUp,
    Cloud,
    CloudOff,
    RefreshCw,
    Upload
} from "lucide-react";
import { initWorkoutPackages, saveWorkoutPackages, deleteWorkoutPackage } from "../services/workoutPackageSync";


interface WorkoutMenuProps {
    dailyPlan: PlanItem[];
    setDailyPlan: (plan: PlanItem[]) => void;
    onUsePlanItem: (item: PlanItem) => void;
    planCompletedItems: string[]; // List of action names completed today
    exercises: Exercise[];
}

export default function WorkoutMenu({ dailyPlan, setDailyPlan, onUsePlanItem, planCompletedItems, exercises }: WorkoutMenuProps) {
    const [showImportPlan, setShowImportPlan] = useState(false);
    const [importJson, setImportJson] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Custom Packages State with Cloud Sync
    const [customPackages, setCustomPackages] = useState<WorkoutPackage[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [showCreatePackage, setShowCreatePackage] = useState(false);

    // New Package Form State
    const [newPackageName, setNewPackageName] = useState("");
    const [newPackageDesc, setNewPackageDesc] = useState("");
    const [newPackageItems, setNewPackageItems] = useState<PlanItem[]>([]);
    const [showAddExerciseToPackage, setShowAddExerciseToPackage] = useState(false); // Dropdown/Search toggle
    const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);

    // 初始化時從 localStorage 載入菜單套餐（不從雲端重新載入）
    useEffect(() => {
        const loadPackages = () => {
            try {
                const saved = localStorage.getItem("customPackages");
                const savedTime = localStorage.getItem("customPackagesLastSync");

                if (saved) {
                    setCustomPackages(JSON.parse(saved));
                    setSyncStatus('success');
                }

                if (savedTime) {
                    setLastSyncTime(new Date(savedTime));
                }
            } catch (error) {
                console.error("Failed to load packages from localStorage:", error);
                setSyncStatus('error');
            }
        };
        loadPackages();
    }, []);

    // 當 customPackages 變更時，只保存到 localStorage（不自動同步到雲端）
    useEffect(() => {
        if (customPackages.length === 0 && syncStatus === 'idle') {
            // 初始狀態，不需要保存
            return;
        }

        // 只保存到 localStorage，不同步到雲端
        localStorage.setItem("customPackages", JSON.stringify(customPackages));
    }, [customPackages]);

    // Main Daily Plan Logic
    const handleImportPlan = () => {
        try {
            const parsed = JSON.parse(importJson);
            if (!Array.isArray(parsed)) throw new Error("Format error: Root must be an array");

            const validPlan = parsed.map((item: any) => ({
                action: item.action || "Unknown",
                sets: Number(item.sets) || 3,
                reps: String(item.reps || "10"),
                weight: item.weight ? String(item.weight) : undefined
            }));

            setDailyPlan(validPlan);
            // Parent component (App) handles saving dailyPlan to localStorage usually via its own effect or setState wrapper
            // But App.tsx logic was: setDailyPlan(val); localStorage.setItem(...);
            // We should probably rely on App.tsx passing a setter that saves, OR duplicate save logic here if setDailyPlan is raw.
            // Checking App.tsx, setDailyPlan is raw useState setter. We should manually save to LS here to be safe or App needs to useEffect.
            // App.tsx DOES NOT have a useEffect for dailyPlan persistence for updates, only init. 
            // So we must save here.
            localStorage.setItem("dailyPlan", JSON.stringify(validPlan));

            setShowImportPlan(false);
            setImportJson("");
            setMessage("菜單匯入成功！");
            setTimeout(() => setMessage(null), 3000);
        } catch (e) {
            setError("JSON 格式錯誤，請檢查");
        }
    };

    const handleLoadPackage = (pkg: WorkoutPackage) => {
        if (dailyPlan.length > 0) {
            if (!window.confirm("今日菜單已有內容，確定要覆蓋嗎？")) return;
        }
        setDailyPlan(pkg.items);
        localStorage.setItem("dailyPlan", JSON.stringify(pkg.items));
        setMessage(`已載入套餐：${pkg.name}`);
        setTimeout(() => setMessage(null), 3000);
    };

    // Custom Package Creation Logic
    const handleAddCustomPackage = () => {
        if (!newPackageName.trim()) {
            setError("請輸入套餐名稱");
            return;
        }
        if (newPackageItems.length === 0) {
            setError("套餐至少需包含一個動作");
            return;
        }

        const newPkg: WorkoutPackage = {
            id: `custom-${Date.now()}`,
            name: newPackageName,
            description: newPackageDesc,
            items: newPackageItems,
            type: "custom"
        };

        setCustomPackages(prev => [...prev, newPkg]);

        // Reset Form
        setNewPackageName("");
        setNewPackageDesc("");
        setNewPackageItems([]);
        setShowCreatePackage(false);
        setMessage("已新增自訂套餐！");
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeletePackage = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("確定要刪除此自訂套餐嗎？")) {
            // 只在本地刪除，不同步到雲端
            setCustomPackages(prev => prev.filter(p => p.id !== id));
            setMessage("已刪除套餐（本地）");
            setTimeout(() => setMessage(null), 3000);
        }
    };

    // 從雲端下載最新數據（只 pull，不 push）
    const handleRefreshFromCloud = async () => {
        setIsSyncing(true);
        setSyncStatus('syncing');
        try {
            // 從雲端下載最新數據
            const packages = await initWorkoutPackages();
            setCustomPackages(packages);

            const now = new Date();
            setLastSyncTime(now);
            localStorage.setItem("customPackagesLastSync", now.toISOString());
            setSyncStatus('success');
            setMessage(`已從雲端載入 ${packages.length} 個套餐！`);
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Failed to refresh packages:", error);
            setSyncStatus('error');
            setError("從雲端載入失敗，請稍後再試");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsSyncing(false);
        }
    };

    // 手動上傳本地數據到雲端
    const handleUploadToCloud = async () => {
        setIsSyncing(true);
        setSyncStatus('syncing');
        try {
            // 上傳本地數據到雲端
            await saveWorkoutPackages(customPackages);

            const now = new Date();
            setLastSyncTime(now);
            localStorage.setItem("customPackagesLastSync", now.toISOString());
            setSyncStatus('success');
            setMessage(`已上傳 ${customPackages.length} 個套餐到雲端！`);
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Failed to upload packages:", error);
            setSyncStatus('error');
            setError("上傳到雲端失敗，請稍後再試");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsSyncing(false);
        }
    };

    // 格式化同步時間顯示
    const formatSyncTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "剛剛";
        if (diffMins < 60) return `${diffMins} 分鐘前`;
        if (diffHours < 24) return `${diffHours} 小時前`;
        if (diffDays < 7) return `${diffDays} 天前`;

        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    };

    const addItemToNewPackage = (exerciseName: string) => {
        setNewPackageItems(prev => [
            ...prev,
            { action: exerciseName, sets: 3, reps: "10" } // defaults
        ]);
    };

    const updateNewPackageItem = (idx: number, field: keyof PlanItem, val: string | number) => {
        setNewPackageItems(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: val };
            return copy;
        });
    };

    const removeNewPackageItem = (idx: number) => {
        setNewPackageItems(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="workout-menu-container">
            {/* 1. Today's Active Plan */}
            <section className="card daily-plan-card" style={{ marginBottom: "20px", borderLeft: "4px solid var(--primary-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <ClipboardList size={22} /> 今日菜單 (Today's Plan)
                    </h2>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            className="btn-secondary"
                            onClick={() => setShowImportPlan(true)}
                            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                        >
                            JSON 匯入
                        </button>
                        <button
                            className="btn-remove"
                            onClick={() => {
                                if (window.confirm("確定要清空今日菜單嗎？")) {
                                    setDailyPlan([]);
                                    localStorage.setItem("dailyPlan", "[]");
                                }
                            }}
                            style={{ opacity: dailyPlan.length ? 1 : 0.5 }}
                            disabled={!dailyPlan.length}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {dailyPlan.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "var(--text-secondary)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                        <p style={{ marginBottom: "12px", fontSize: "1rem" }}>今日尚未安排訓練</p>
                        <p style={{ fontSize: "0.85rem" }}>請從下方選擇「預設套餐」或「自訂套餐」開始，<br />或點擊上方按鈕匯入。</p>
                    </div>
                ) : (
                    <div className="plan-list grid">
                        {dailyPlan.map((item, idx) => {
                            const isCompleted = planCompletedItems.includes(item.action);
                            return (
                                <div
                                    key={idx}
                                    className={`plan-item ${isCompleted ? "completed" : ""}`}
                                    style={{
                                        padding: "12px",
                                        background: isCompleted ? "rgba(76, 175, 80, 0.1)" : "var(--bg-secondary)",
                                        borderRadius: "8px",
                                        border: isCompleted ? "1px solid var(--success-color)" : "1px solid transparent",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                        position: "relative"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ fontWeight: "600", color: isCompleted ? "var(--success-color)" : "var(--text-primary)" }}>
                                            {item.action}
                                        </div>
                                        {isCompleted && <Check size={18} color="var(--success-color)" />}
                                    </div>
                                    <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                        {item.sets} 組 × {item.reps} 次 {item.weight ? `@ ${item.weight}kg` : ""}
                                    </div>
                                    {!isCompleted && (
                                        <button
                                            className="btn-primary"
                                            onClick={() => onUsePlanItem(item)}
                                            style={{
                                                marginTop: "4px",
                                                padding: "6px",
                                                fontSize: "0.85rem",
                                                width: "100%",
                                                justifyContent: "center"
                                            }}
                                        >
                                            開始訓練
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* 2. Package Selection Area */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 16px", flexWrap: "wrap", gap: "12px" }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Package size={20} /> 訓練套餐 (Packages)
                </h3>
                {/* 同步狀態指示器與刷新按鈕 */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {syncStatus === 'syncing' && (
                            <>
                                <Cloud size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                                <span>同步中...</span>
                            </>
                        )}
                        {syncStatus === 'success' && (
                            <>
                                <Cloud size={16} color="var(--success-color)" />
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <span style={{ color: "var(--success-color)" }}>已同步</span>
                                    {lastSyncTime && (
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                                            {formatSyncTime(lastSyncTime)}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                        {syncStatus === 'error' && (
                            <>
                                <CloudOff size={16} color="var(--error-color)" />
                                <span style={{ color: "var(--error-color)" }}>同步失敗</span>
                            </>
                        )}
                    </div>
                    <button
                        className="btn-secondary"
                        onClick={handleRefreshFromCloud}
                        disabled={isSyncing}
                        style={{
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            opacity: isSyncing ? 0.6 : 1
                        }}
                        title="從雲端重新載入"
                    >
                        <RefreshCw size={14} className={isSyncing ? "spin" : ""} style={isSyncing ? { animation: "spin 1s linear infinite" } : {}} />
                        刷新
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={handleUploadToCloud}
                        disabled={isSyncing || customPackages.length === 0}
                        style={{
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            opacity: (isSyncing || customPackages.length === 0) ? 0.6 : 1
                        }}
                        title="上傳本地數據到雲端"
                    >
                        <Upload size={14} />
                        上傳
                    </button>
                </div>
            </div>

            <div className="packages-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {/* All packages (including presets from cloud) */}
                {customPackages.map((pkg) => {
                    return (
                        <div
                            key={pkg.id}
                            className="card package-card"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                                padding: "0",
                                overflow: "hidden",
                                border: "1px solid var(--border-input)"
                            }}
                        >
                            {/* Header Section with Unified Theme Color */}
                            <div style={{
                                background: "var(--primary-bg-subtle)",
                                padding: "16px 16px 12px",
                                borderBottom: "1px solid var(--primary-bg-subtle-hover)"
                            }}>
                                {/* Category Tag */}
                                {pkg.category && (
                                    <div style={{
                                        display: "inline-block",
                                        fontSize: "0.7rem",
                                        fontWeight: "600",
                                        color: "var(--primary-main)",
                                        border: "1px solid var(--primary-main)",
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        marginBottom: "6px",
                                        background: "rgba(255,255,255,0.4)"
                                    }}>
                                        {pkg.category}
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--primary-main)" }}>{pkg.name}</h4>
                                    {pkg.type === "custom" && !pkg.category && (
                                        <button
                                            onClick={(e) => handleDeletePackage(pkg.id, e)}
                                            className="btn-icon-danger"
                                            title="刪除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                {pkg.description && (
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "8px", lineHeight: "1.4" }}>
                                        {pkg.description}
                                    </p>
                                )}
                            </div>

                            {/* Body Section */}
                            <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                                {/* Preview items (collapsed/summary) */}
                                <div style={{ background: "var(--bg-main)", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.85rem", flex: 1 }}>
                                    {(expandedPackageId === pkg.id ? pkg.items : pkg.items.slice(0, 3)).map((item, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <span>{item.action}</span>
                                            <span style={{ color: "var(--text-secondary)" }}>{item.sets}x{item.reps}</span>
                                        </div>
                                    ))}

                                    {pkg.items.length > 3 && expandedPackageId !== pkg.id && (
                                        <div
                                            onClick={() => setExpandedPackageId(pkg.id)}
                                            style={{
                                                textAlign: "center",
                                                color: "var(--primary-main)", // Unified theme color
                                                fontSize: "0.8rem",
                                                cursor: "pointer",
                                                marginTop: "8px",
                                                fontWeight: "500"
                                            }}
                                        >
                                            ... 點擊查看全部 (+{pkg.items.length - 3})
                                        </div>
                                    )}

                                    {expandedPackageId === pkg.id && (
                                        <div
                                            onClick={() => setExpandedPackageId(null)}
                                            style={{
                                                textAlign: "center",
                                                color: "var(--text-secondary)",
                                                fontSize: "0.8rem",
                                                cursor: "pointer",
                                                marginTop: "8px",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}
                                        >
                                            <ChevronUp size={14} style={{ marginRight: "4px" }} /> 收起
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={() => handleLoadPackage(pkg)}
                                    style={{
                                        width: "100%",
                                        justifyContent: "center",
                                        // Standard btn-primary style is fine, no inline override needed
                                    }}
                                >
                                    <Play size={16} style={{ marginRight: "6px" }} /> 載入此菜單
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Create New Card */}
                <div
                    className="card create-package-card"
                    onClick={() => setShowCreatePackage(true)}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        border: "2px dashed var(--border-color)",
                        minHeight: "200px",
                        background: "transparent"
                    }}
                >
                    <div style={{ background: "var(--primary-bg-subtle)", borderRadius: "50%", padding: "12px", marginBottom: "12px" }}>
                        <Plus size={32} color="var(--primary-color)" />
                    </div>
                    <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>建立自訂套餐</span>
                </div>
            </div>

            {/* 3. Create Custom Package Modal */}
            {showCreatePackage && (
                <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3>建立自訂套餐</h3>
                            <button onClick={() => setShowCreatePackage(false)} style={{ background: "none", border: "none" }}><X size={24} /></button>
                        </div>

                        <div className="grid">
                            <label>
                                套餐名稱
                                <input value={newPackageName} onChange={e => setNewPackageName(e.target.value)} placeholder="我的超強腿日" />
                            </label>
                            <label className="full">
                                描述 (選填)
                                <input value={newPackageDesc} onChange={e => setNewPackageDesc(e.target.value)} placeholder="針對股四頭肌..." />
                            </label>

                            <div className="full" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "8px" }}>
                                <h4 style={{ marginBottom: "12px" }}>動作列表</h4>

                                {/* Add Exercise UI */}
                                <div style={{ marginBottom: "16px" }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setShowAddExerciseToPackage(!showAddExerciseToPackage)}
                                        style={{ width: "100%", justifyContent: "center" }}
                                    >
                                        <Plus size={16} style={{ marginRight: "6px" }} /> 加入動作
                                    </button>

                                    {showAddExerciseToPackage && (
                                        <div style={{
                                            marginTop: "8px",
                                            background: "var(--bg-main)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "6px",
                                            maxHeight: "200px",
                                            overflowY: "auto"
                                        }}>
                                            {exercises.map((ex, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        addItemToNewPackage(ex.zh);
                                                        setShowAddExerciseToPackage(false);
                                                    }}
                                                    style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border-color)" }}
                                                    className="exercise-option"
                                                >
                                                    {ex.zh} <span style={{ opacity: 0.6, fontSize: "0.85rem" }}>{ex.en}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Items List */}
                                {newPackageItems.length === 0 ? (
                                    <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>尚未加入動作</p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {newPackageItems.map((item, idx) => (
                                            <div key={idx} style={{ background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontWeight: 600, flex: 1 }}>{item.action}</span>
                                                <input
                                                    type="number"
                                                    value={item.sets}
                                                    onChange={e => updateNewPackageItem(idx, "sets", Number(e.target.value))}
                                                    style={{ width: "60px", padding: "4px" }}
                                                    placeholder="Sets"
                                                />
                                                <span style={{ fontSize: "0.85rem" }}>組</span>
                                                <input
                                                    value={item.reps}
                                                    onChange={e => updateNewPackageItem(idx, "reps", e.target.value)}
                                                    style={{ width: "60px", padding: "4px" }}
                                                    placeholder="Reps"
                                                />
                                                <span style={{ fontSize: "0.85rem" }}>次</span>
                                                <button onClick={() => removeNewPackageItem(idx)} className="btn-remove" style={{ marginLeft: "4px" }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <p style={{ color: "var(--error-color)", marginTop: "16px" }}>{error}</p>}

                        <div className="actions" style={{ marginTop: "24px" }}>
                            <button className="btn-secondary" onClick={() => setShowCreatePackage(false)}>取消</button>
                            <button className="btn-primary" onClick={handleAddCustomPackage}>
                                <Save size={18} style={{ marginRight: "6px" }} /> 儲存套餐
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import JSON Modal (Legacy/Power User) */}
            {showImportPlan && (
                <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
                    <div className="card" style={{ width: "100%", maxWidth: "500px", margin: 0 }}>
                        <h3>JSON 匯入</h3>
                        <textarea
                            value={importJson}
                            onChange={e => setImportJson(e.target.value)}
                            placeholder={`[{ "action": "深蹲", "sets": 3, "reps": "8" }]`}
                            rows={6}
                            style={{ width: "100%", fontFamily: "monospace", margin: "16px 0" }}
                        />
                        <div className="actions">
                            <button className="btn-secondary" onClick={() => setShowImportPlan(false)}>取消</button>
                            <button className="btn-primary" onClick={handleImportPlan}>確認</button>
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--success-color)",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "30px",
                    zIndex: 2000,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                }}>
                    {message}
                </div>
            )}
        </div>
    );
}
