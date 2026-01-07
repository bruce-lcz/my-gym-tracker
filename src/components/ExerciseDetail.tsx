import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { TrainingLog } from "../types";
import { Calendar, TrendingUp, Award, List } from "lucide-react";

interface ExerciseDetailProps {
    exerciseName: string;
    logs: TrainingLog[];
    color?: string;
}

export default function ExerciseDetail({ exerciseName, logs, color = "#FF8042" }: ExerciseDetailProps) {
    // Filter logs for this exercise and sort by date
    const exerciseLogs = useMemo(() => {
        return logs
            .filter(log => log.actionZh === exerciseName)
            .sort((a, b) => new Date(a.currentDate).getTime() - new Date(b.currentDate).getTime());
    }, [logs, exerciseName]);

    // Calculate Statistics
    const stats = useMemo(() => {
        let maxWeight = 0;
        let totalSets = 0;
        const historyData: any[] = [];

        exerciseLogs.forEach(log => {
            // Calculate max weight for this session
            const validSets = log.sets.filter(s => s.weight && !isNaN(Number(s.weight)));
            const sessionMax = validSets.length > 0
                ? Math.max(...validSets.map(s => Number(s.weight)))
                : 0;

            if (sessionMax > maxWeight) maxWeight = sessionMax;

            const setBytes = validSets.length;
            totalSets += setBytes;

            // Prepare Chart Data
            historyData.push({
                date: log.currentDate,
                maxWeight: sessionMax,
                volume: validSets.reduce((acc, s) => acc + (Number(s.weight) * Number(s.reps || 0)), 0)
            });
        });

        return { maxWeight, totalSets, historyData };
    }, [exerciseLogs]);

    // Reverse logs for the history list display (newest first)
    const historyList = useMemo(() => [...exerciseLogs].reverse(), [exerciseLogs]);

    if (exerciseLogs.length === 0) return null;

    return (
        <div className="exercise-detail-container fade-in">
            <div className="detail-header">
                <h3>
                    <TrendingUp className="icon-mr" size={24} />
                    {exerciseName} 詳細數據
                </h3>
                <div className="stats-badges">
                    <div className="stat-badge">
                        <Award size={16} />
                        <span>PR: {stats.maxWeight} kg</span>
                    </div>
                    <div className="stat-badge">
                        <List size={16} />
                        <span>總組數: {stats.totalSets}</span>
                    </div>
                    <div className="stat-badge">
                        <Calendar size={16} />
                        <span>訓練次數: {exerciseLogs.length}</span>
                    </div>
                </div>
            </div>

            <div className="detail-grid">
                {/* Progress Chart */}
                <div className="chart-section card">
                    <h4>進步趨勢 (最大重量)</h4>
                    <div style={{ width: "100%", height: 250 }}>
                        <ResponsiveContainer>
                            <LineChart data={stats.historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis dataKey="maxWeight" width={40} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="maxWeight"
                                    name="最大重量 (kg)"
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* History List */}
                <div className="history-section card">
                    <h4>近期紀錄</h4>
                    <div className="history-list-scroll">
                        {historyList.map((log, idx) => (
                            <div key={log.id || idx} className="history-item">
                                <div className="history-date">{log.currentDate}</div>
                                <div className="history-sets">
                                    {[...log.sets].reverse().map((s, i) => (
                                        <span key={i} className="set-tag">
                                            {s.weight}kg × {s.reps}
                                        </span>
                                    ))}
                                </div>
                                {log.notes && <div className="history-notes">{log.notes}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        .exercise-detail-container {
          margin-top: 30px;
          border-top: 2px dashed var(--border-color);
          padding-top: 20px;
          animation: fadeIn 0.5s ease;
        }
        .detail-header {
          margin-bottom: 20px;
        }
        .detail-header h3 {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.5rem;
            color: ${color};
            margin-bottom: 12px;
        }
        .stats-badges {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .stat-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            background: var(--bg-secondary);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            border: 1px solid var(--border-color);
        }
        .detail-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        @media (max-width: 768px) {
            .detail-grid {
                grid-template-columns: 1fr;
            }
        }
        .history-list-scroll {
            max-height: 250px;
            overflow-y: auto;
            padding-right: 5px;
        }
        .history-item {
            padding: 10px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 5px;
        }
        .history-item:last-child {
            border-bottom: none;
        }
        .history-date {
            font-size: 0.85rem;
            opacity: 0.7;
            margin-bottom: 4px;
        }
        .history-sets {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .set-tag {
            background: var(--bg-hover);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.8rem;
        }
        .history-notes {
            font-size: 0.8rem;
            margin-top: 4px;
            font-style: italic;
            opacity: 0.8;
            color: var(--text-secondary);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
