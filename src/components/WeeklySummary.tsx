import { useState, useEffect } from "react";
import "./WeeklySummary.css";
import { TrainingLog, User, AIAnalysis } from "../types";
import { Clipboard, Loader2, FileText, Calendar, RefreshCw } from "lucide-react";
import OpenAI from "openai";
import { saveAIAnalysis, fetchAIAnalysis } from "../api";
import {
    getWeekRanges,
    filterLogsByRange,
    generateSummaryMarker,
    parseSummaryMeta,
    shouldGenerateSummary
} from "../services/summaryService";

interface WeeklySummaryProps {
    user: User;
    logs: TrainingLog[];
    primaryColor: string;
}

export default function WeeklySummary({ user, logs, primaryColor }: WeeklySummaryProps) {
    const [generating, setGenerating] = useState(false);
    const [history, setHistory] = useState<AIAnalysis[]>([]);
    const [loading, setLoading] = useState(false);
    const [ranges] = useState(getWeekRanges());

    // Load history on mount or user change
    useEffect(() => {
        loadHistory();
    }, [user]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const res = await fetchAIAnalysis(user);
            if (res.ok && res.data) {
                setHistory(res.data);
            }
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setLoading(false);
        }
    };

    const generateWeeklySummary = async (weekType: 'thisWeek' | 'lastWeek') => {
        if (generating) return;
        setGenerating(true);
        try {
            const range = weekType === 'thisWeek' ? ranges.thisWeek : ranges.lastWeek;
            const targetLogs = filterLogsByRange(logs, range.start, range.end);

            if (targetLogs.length === 0) {
                alert("該區間無訓練紀錄，無法生成摘要");
                setGenerating(false);
                return;
            }

            const apiKey = import.meta.env.VITE_GROQ_API_KEY;
            if (!apiKey) throw new Error("Missing API Key");

            const openai = new OpenAI({
                apiKey: apiKey,
                baseURL: "https://api.groq.com/openai/v1",
                dangerouslyAllowBrowser: true,
            });

            // Compact Log Format
            const logsText = targetLogs.map(l => {
                const setsText = l.sets.map(s => `${s.weight}kg`).join('/');
                return `[${l.currentDate.slice(5)}] ${l.actionZh} ${l.targetMuscle} (${l.sets.length}組: ${setsText})`;
            }).join('\n');

            const prompt = `
            請將以下訓練記錄整理成一份「${weekType === 'thisWeek' ? '本週' : '上週'}訓練摘要」，格式必須極度精簡，方便複製貼上分享。
            
            **日期範圍**: ${range.start} ~ ${range.end}
            
            **原始記錄**:
            ${logsText}
            
            **要求格式**:
            [YYYY/MM/DD] (單日) 或 [YYYY/MM/DD-MM/DD] (多日合併)
            動作A 重量(組數), 動作B 重量(組數)...
            
            **範例**:
            [01/20] 
            臥推 100kg(3組), 深蹲 120kg(5組), 滑輪下拉 60kg(4組)

            [01/22-01/23]
            器械飛鳥 30kg(3組), 腹部訓練 15kg(4組)
            
            **規則**:
            1. **關鍵規則**：如果日期是同一天，請只顯示一個日期 (例如 [2026/01/14])，絕對不要顯示範圍 (錯誤範例：[2026/01/14-01/14])。
            2. 只列出有做的動作。
            3. 不要有任何開場白或結尾。
            4. 直接輸出結果。
            5. 如果有不同日期的訓練，請依日期分段。
            6. 使用繁體中文。
            `;

            const response = await openai.chat.completions.create({
                model: "openai/gpt-oss-120b",
                messages: [{ role: "user", content: prompt }],
                max_completion_tokens: 1000,
            });

            const content = response.choices[0]?.message?.content || "";
            if (content) {
                // Add Marker
                const markedContent = generateSummaryMarker(range.start, range.end) + content;
                const res = await saveAIAnalysis(user, markedContent);
                if (res.ok) {
                    loadHistory();
                }
            }

        } catch (e) {
            console.error(e);
            alert("生成失敗，請稍後再試");
        } finally {
            setGenerating(false);
        }
    };

    // Auto-Run Logic
    useEffect(() => {
        if (logs.length === 0 || loading) return;

        const checkAutoRun = async () => {
            // Find existing summaries in history
            const lastWeekSummary = history.find((h: AIAnalysis) => {
                const m = parseSummaryMeta(h.content);
                return m && m.rangeParams === `${ranges.lastWeek.start}_${ranges.lastWeek.end}`;
            });

            // If Last Week missing -> Generate
            if (!lastWeekSummary && !generating) {
                const hasLogs = filterLogsByRange(logs, ranges.lastWeek.start, ranges.lastWeek.end).length > 0;
                if (hasLogs) generateWeeklySummary('lastWeek');
            }

            // If This Week -> Check logic
            if (!generating) {
                const hasLogs = filterLogsByRange(logs, ranges.thisWeek.start, ranges.thisWeek.end).length > 0;
                if (hasLogs) {
                    const should = shouldGenerateSummary(
                        ranges.thisWeek.start,
                        ranges.thisWeek.end,
                        history,
                        new Date().toISOString().split('T')[0]
                    );
                    if (should.shouldRun) {
                        generateWeeklySummary('thisWeek');
                    }
                }
            }
        };

        const timer = setTimeout(checkAutoRun, 1500);
        return () => clearTimeout(timer);
    }, [history, logs, loading]);

    const copyToClipboard = (text: string) => {
        const cleanText = text.replace(/<!--.*?-->\n\n/g, "");
        navigator.clipboard.writeText(cleanText);
        alert("已複製到剪貼簿");
    };

    const lastWeekSummary = history.find((h: AIAnalysis) => {
        const m = parseSummaryMeta(h.content);
        return m && m.rangeParams === `${ranges.lastWeek.start}_${ranges.lastWeek.end}`;
    });

    const thisWeekSummary = history.find((h: AIAnalysis) => {
        const m = parseSummaryMeta(h.content);
        return m && m.rangeParams === `${ranges.thisWeek.start}_${ranges.thisWeek.end}`;
    });

    const hasLastWeekData = lastWeekSummary && lastWeekSummary.content;
    const hasThisWeekData = thisWeekSummary && thisWeekSummary.content;

    return (
        <div
            className="weekly-summary-section"
            style={{ "--summary-accent": primaryColor } as React.CSSProperties}
        >
            <div className="section-header">
                <div className="icon-badge">
                    <FileText size={20} />
                </div>
                <h3>週報摘要</h3>
                <span className="subtitle">AI 智能分析與進度追蹤</span>
            </div>

            <div className="summary-grid">
                {/* Last Week Card */}
                <div className={`summary-card ${hasLastWeekData ? 'has-data' : 'empty'}`}>
                    <div className="card-header">
                        <div className="header-info">
                            <span className="period-label">上週表現</span>
                            <span className="date-range">{ranges.lastWeek.start} ~ {ranges.lastWeek.end}</span>
                        </div>
                        <button
                            className="btn-icon"
                            onClick={() => generateWeeklySummary('lastWeek')}
                            disabled={generating}
                            title="重新生成摘要"
                        >
                            {generating ? <Loader2 size={16} className="spin-animation" /> : <RefreshCw size={16} />}
                        </button>
                    </div>

                    <div className="card-body">
                        {lastWeekSummary ? (
                            <>
                                <div className="summary-content">
                                    {lastWeekSummary.content.replace(/<!--.*?-->\n\n/g, "")}
                                </div>
                                <div className="card-actions">
                                    <button
                                        className="btn-copy"
                                        onClick={() => copyToClipboard(lastWeekSummary.content)}
                                    >
                                        <Clipboard size={14} />
                                        <span>複製摘要</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                {generating ? (
                                    <div className="loading-state">
                                        <Loader2 size={24} className="spin-animation" />
                                        <span>AI 正在分析歷史數據...</span>
                                    </div>
                                ) : (
                                    <span>尚無上週訓練資料</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* This Week Card */}
                <div className={`summary-card ${hasThisWeekData ? 'has-data' : 'empty'}`}>
                    <div className="card-header">
                        <div className="header-info">
                            <span className="period-label">本週進度</span>
                            <span className="date-range">{ranges.thisWeek.start} ~ {ranges.thisWeek.end}</span>
                        </div>
                        <button
                            className="btn-icon"
                            onClick={() => generateWeeklySummary('thisWeek')}
                            disabled={generating}
                            title="重新生成摘要"
                        >
                            {generating ? <Loader2 size={16} className="spin-animation" /> : <RefreshCw size={16} />}
                        </button>
                    </div>

                    <div className="card-body">
                        {thisWeekSummary ? (
                            <>
                                <div className="summary-content">
                                    {thisWeekSummary.content.replace(/<!--.*?-->\n\n/g, "")}
                                </div>
                                <div className="card-actions">
                                    <button
                                        className="btn-copy"
                                        onClick={() => copyToClipboard(thisWeekSummary.content)}
                                    >
                                        <Clipboard size={14} />
                                        <span>複製摘要</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                {generating ? (
                                    <div className="loading-state">
                                        <Loader2 size={24} className="spin-animation" />
                                        <span>正在生成本週摘要...</span>
                                    </div>
                                ) : (
                                    <span>本週訓練進行中...</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
