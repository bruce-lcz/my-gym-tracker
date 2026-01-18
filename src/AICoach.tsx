import { useState, useMemo, useEffect } from "react";
import { TrainingLog, User, AIAnalysis } from "./types";
import { Sparkles, TrendingUp, Calendar, Dumbbell, Activity, AlertCircle, Loader2, History, Clock, CheckCircle2 } from "lucide-react";
import OpenAI from "openai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { saveAIAnalysis, fetchAIAnalysis } from "./api";

interface AICoachProps {
    user: User;
    logs: TrainingLog[];
}

// Green/Nature Tones for Bruce
const BRUCE_PRIMARY = "#2E8B57";
// Maillard/Earthy Tones for Linda
const LINDA_PRIMARY = "#8D6E63";

export default function AICoach({ user, logs }: AICoachProps) {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<AIAnalysis[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

    const primaryColor = user === "Linda" ? LINDA_PRIMARY : BRUCE_PRIMARY;

    // Load history on mount or user change
    useEffect(() => {
        loadHistory();
    }, [user]);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetchAIAnalysis(user);
            if (res.ok && res.data) {
                setHistory(res.data);
                // If no current analysis, show the latest from history
                if (!analysis && res.data.length > 0) {
                    setAnalysis(res.data[0].content);
                }
            }
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // 計算訓練數據摘要
    const trainingStats = useMemo(() => {
        if (logs.length === 0) {
            return {
                totalWorkouts: 0,
                uniqueDays: 0,
                muscleDistribution: {},
                recentWorkouts: [],
                mostFrequentExercise: "",
            };
        }

        const uniqueDays = new Set(logs.map(log => log.currentDate)).size;
        const muscleDistribution: Record<string, number> = {};
        const exerciseCounts: Record<string, number> = {};

        logs.forEach(log => {
            const muscle = log.targetMuscle || "未分類";
            muscleDistribution[muscle] = (muscleDistribution[muscle] || 0) + 1;
            exerciseCounts[log.actionZh] = (exerciseCounts[log.actionZh] || 0) + 1;
        });

        const mostFrequentExercise = Object.entries(exerciseCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "";

        const recentWorkouts = [...logs]
            .sort((a, b) => new Date(b.currentDate).getTime() - new Date(a.currentDate).getTime())
            .slice(0, 10)
            .map(log => ({
                date: log.currentDate,
                exercise: log.actionZh,
                muscle: log.targetMuscle,
                sets: log.sets.length,
                rpe: log.rpe || "N/A",
            }));

        return {
            totalWorkouts: logs.length,
            uniqueDays,
            muscleDistribution,
            recentWorkouts,
            mostFrequentExercise,
        };
    }, [logs]);

    const analyzeWithAI = async () => {
        setAnalyzing(true);
        setError(null);
        setAnalysis(null);
        setSaveStatus("idle");

        try {
            const apiKey = import.meta.env.VITE_GROQ_API_KEY;

            if (!apiKey) {
                throw new Error("未設定 GROQ_API_KEY，請在 .env.local 中設定 VITE_GROQ_API_KEY");
            }

            const openai = new OpenAI({
                apiKey: apiKey,
                baseURL: "https://api.groq.com/openai/v1",
                dangerouslyAllowBrowser: true,
            });

            const dataSummary = `
            使用者: ${user}
            總訓練次數: ${trainingStats.totalWorkouts}
            訓練天數: ${trainingStats.uniqueDays}
            平均每天訓練次數: ${(trainingStats.totalWorkouts / trainingStats.uniqueDays).toFixed(1)}

            肌群分佈:
            ${Object.entries(trainingStats.muscleDistribution)
                    .map(([muscle, count]) => `- ${muscle}: ${count} 次 (${((count / trainingStats.totalWorkouts) * 100).toFixed(1)}%)`)
                    .join('\n')}

            最常訓練的動作: ${trainingStats.mostFrequentExercise}

            最近 10 次訓練記錄:
            ${trainingStats.recentWorkouts
                    .map((w, i) => `${i + 1}. ${w.date} - ${w.exercise} (${w.muscle}) - ${w.sets}組, RPE: ${w.rpe}`)
                    .join('\n')}
                `.trim();

            const response = await openai.chat.completions.create({
                model: "gpt-oss-120b",
                messages: [
                    {
                        role: "system",
                        content: `你是一位嚴格且專業的健身教練。請直接針對數據進行分析，不要使用客套話。

                        **你的回答必須包含豐富的 Markdown 視覺元素，讓重點一目瞭然：**

                        1. **粗體強調 (關鍵)**：所有「數字」、「肌群名稱」、「訓練動作」與「RPE 值」**必須**使用粗體。
                        - 範例：本次訓練總量為 **12,500 kg**，主要集中在 **胸大肌**。
                        2. **列表與層級**：使用清晰的點列式清單。
                        3. **引用重點**：對於最重要的建議或警告，請使用引用區塊（>）。
                        4. **Emoji 使用**：在每個標題和關鍵建議前加入適當的 Emoji。

                        **分析結構（請使用 H3 標題 \`###\`）：**
                        ### 📊 訓練頻率與一致性
                        ### ⚖️ 肌群平衡分析
                        ### 💥 訓練強度與 RPE
                        ### 💡 具體改進建議 (3-5 點)
                        ### 🚀 短期重點 (下週)：立即執行的具體調整
                        ### 🎯 中期目標 (2-4 週)：週期性調整方向

                        **嚴格禁止**：
                        - **絕對禁止**在結尾處添加客套話或後續服務提議（如：「如果需要...」、「我可以幫你...」、「祝你訓練順利」）。
                        - **講完中期目標後請直接結束回答**，不要有任何結尾語。
                        - 禁止詢問用戶意願。
                        - 使用 **繁體中文** 回答。`,
                    },
                    {
                        role: "user",
                        content: `請分析我的訓練數據並提供建議：\n\n${dataSummary}`,
                    },
                ],
                max_completion_tokens: 16000,
                reasoning_effort: "high",
            });

            console.log("Groq AI Response:", response);
            const choice = response.choices?.[0];
            const aiResponse = choice?.message?.content;

            if (aiResponse) {
                setAnalysis(aiResponse);
                // Save to Google Sheets automatically
                saveToSheets(aiResponse);
            } else {
                const refusal = (choice?.message as any)?.refusal;
                const finishReason = choice?.finish_reason;
                throw new Error(refusal || `AI 未返回分析結果 (原因: ${finishReason || "未知"})`);
            }
        } catch (err: any) {
            console.error("AI 分析錯誤:", err);
            setError(err.message || "無法連接到 AI 服務，請檢查網路連線和 API 設定");
        } finally {
            setAnalyzing(false);
        }
    };

    const saveToSheets = async (content: string) => {
        setSaveStatus("saving");
        try {
            const res = await saveAIAnalysis(user, content);
            if (res.ok) {
                setSaveStatus("saved");
                loadHistory(); // Reload history to show the new entry
            } else {
                setSaveStatus("error");
            }
        } catch (err) {
            console.error("Save error:", err);
            setSaveStatus("error");
        }
    };

    const handleSelectPastAnalysis = (pastContent: string) => {
        setAnalysis(pastContent);
        setShowHistory(false);
        window.scrollTo({ top: document.querySelector('.ai-coach-result-anchor')?.getBoundingClientRect().top ?? 0 + window.scrollY - 100, behavior: 'smooth' });
    };

    const currentAnalysisData = history.find(h => h.content === analysis);

    return (
        <div className="ai-coach-container" style={{ padding: "0 10px", paddingBottom: "80px" }}>
            {/* Header Section */}
            <section className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                            <Sparkles size={32} color={primaryColor} />
                            <h2 style={{ margin: 0, fontSize: "1.8rem" }}>AI 助理健身教練</h2>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "600px", margin: 0 }}>
                            讓 AI 分析你的訓練數據，獲得個性化的專業建議
                        </p>
                    </div>

                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="btn-secondary"
                        style={{ padding: "10px 16px" }}
                    >
                        <History size={18} />
                        歷史記錄 {history.length > 0 && `(${history.length})`}
                    </button>
                </div>

                {showHistory && (
                    <div style={{
                        marginTop: "20px",
                        background: "var(--primary-bg-subtle)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: `1px solid ${primaryColor}33`
                    }}>
                        <h4 style={{ margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Clock size={16} /> 過去的分析記錄
                        </h4>
                        {loadingHistory ? (
                            <div style={{ textAlign: "center", padding: "20px" }}><Loader2 className="spin-animation" /></div>
                        ) : history.length === 0 ? (
                            <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>尚無歷史記錄</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {history.map((h) => (
                                    <div
                                        key={h.id}
                                        onClick={() => handleSelectPastAnalysis(h.content)}
                                        style={{
                                            padding: "12px",
                                            background: "var(--card-bg)",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            border: "1px solid var(--border-color)",
                                            fontSize: "0.9rem",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}
                                        className="history-item-hover"
                                    >
                                        <span>{new Date(h.timestamp || "").toLocaleString('zh-TW')} 的建議</span>
                                        <Sparkles size={14} opacity={0.5} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Training Stats Overview */}
            <section className="card">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={22} />
                    訓練數據摘要
                </h3>
                <div className="ai-stats-grid" style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "16px",
                    marginTop: "20px"
                }}>
                    <div className="stat-card" style={{
                        padding: "20px",
                        background: "var(--card-bg)",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        textAlign: "center"
                    }}>
                        <Dumbbell size={24} color={primaryColor} style={{ marginBottom: "8px" }} />
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: primaryColor }}>
                            {trainingStats.totalWorkouts}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>總訓練次數</div>
                    </div>

                    <div className="stat-card" style={{
                        padding: "20px",
                        background: "var(--card-bg)",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        textAlign: "center"
                    }}>
                        <Calendar size={24} color={primaryColor} style={{ marginBottom: "8px" }} />
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: primaryColor }}>
                            {trainingStats.uniqueDays}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>訓練天數</div>
                    </div>

                    <div className="stat-card" style={{
                        padding: "20px",
                        background: "var(--card-bg)",
                        borderRadius: "12px",
                        border: "1px solid var(--border-color)",
                        textAlign: "center"
                    }}>
                        <Activity size={24} color={primaryColor} style={{ marginBottom: "8px" }} />
                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: primaryColor }}>
                            {trainingStats.uniqueDays > 0 ? (trainingStats.totalWorkouts / trainingStats.uniqueDays).toFixed(1) : "0"}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>平均每日訓練</div>
                    </div>
                </div>

                {/* Muscle Distribution */}
                {Object.keys(trainingStats.muscleDistribution).length > 0 && (
                    <div style={{ marginTop: "30px" }}>
                        <h4 style={{ marginBottom: "16px", fontSize: "1.1rem" }}>肌群訓練分佈</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {Object.entries(trainingStats.muscleDistribution)
                                .sort((a, b) => b[1] - a[1])
                                .map(([muscle, count]) => {
                                    const percentage = (count / trainingStats.totalWorkouts) * 100;
                                    return (
                                        <div key={muscle} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ minWidth: "80px", fontSize: "0.9rem", flex: "0 0 auto" }}>{muscle}</div>
                                            <div style={{
                                                flex: 1,
                                                height: "24px",
                                                background: "var(--input-bg)",
                                                borderRadius: "12px",
                                                overflow: "hidden",
                                                position: "relative"
                                            }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: "100%",
                                                    background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}dd)`,
                                                    transition: "width 0.3s ease"
                                                }} />
                                            </div>
                                            <div style={{ minWidth: "50px", fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "right" }}>
                                                {count} 次
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </section>

            {/* AI Analysis Section */}
            <section className="card ai-coach-result-anchor">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                    <Sparkles size={22} />
                    AI 專業分析與建議
                </h3>

                {logs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
                        <AlertCircle size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                        <p>尚無訓練數據，請先新增一些訓練記錄</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                            <button
                                onClick={analyzeWithAI}
                                disabled={analyzing}
                                style={{
                                    flex: 1,
                                    padding: "16px 24px",
                                    fontSize: "1.1rem"
                                }}
                            >
                                {analyzing ? (
                                    <>
                                        <Loader2 size={20} className="spin-animation" />
                                        教練分析中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        取得最新 AI 分析建議
                                    </>
                                )}
                            </button>
                        </div>

                        {analyzing && (
                            <div style={{
                                marginTop: "30px",
                                padding: "40px 20px",
                                textAlign: "center",
                                background: "var(--primary-bg-subtle)",
                                borderRadius: "16px",
                                border: `1px dashed ${primaryColor}66`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "16px"
                            }}>
                                <Loader2 size={48} className="spin-animation" color={primaryColor} />
                                <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-main)" }}>
                                    教練正在分析中，請稍候...
                                </div>
                                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                    正在檢閱您的訓練頻率、肌群平衡與強度記錄
                                </div>
                            </div>
                        )}

                        {error && (
                            <div style={{
                                marginTop: "20px",
                                padding: "16px",
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "8px",
                                color: "#ef4444",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px"
                            }}>
                                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
                                <div>
                                    <strong>錯誤:</strong> {error}
                                </div>
                            </div>
                        )}

                        {analysis && (
                            <div className="coach-bubble" style={{ marginTop: "24px" }}>
                                <div className="analysis-meta">
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <Clock size={14} />
                                        {currentAnalysisData ? `建議生成於: ${new Date(currentAnalysisData.timestamp || "").toLocaleString('zh-TW')}` : "最新生成的建議"}
                                    </div>
                                    <div style={{ flex: 1 }} />
                                    {saveStatus === "saving" && <span style={{ fontSize: "0.75rem" }}><Loader2 size={12} className="spin-animation" /> 正在存檔至 Google...</span>}
                                    {saveStatus === "saved" && <span style={{ fontSize: "0.75rem", color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle2 size={12} /> 已同步至雲端</span>}
                                </div>

                                <div className="ai-coach-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {analysis}
                                    </ReactMarkdown>
                                </div>

                                <div style={{
                                    marginTop: "24px",
                                    paddingTop: "16px",
                                    borderTop: "1px solid var(--card-border)",
                                    textAlign: "right"
                                }}>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                                        Powered by Training Insights Engine
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* CSS Animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
                .history-item-hover:hover {
                    background: var(--primary-bg-subtle) !important;
                    border-color: ${primaryColor}66 !important;
                    transform: translateX(4px);
                    transition: all 0.2s ease;
                }
            `}</style>
        </div>
    );
}
