import { useMemo, useState, useRef, useEffect } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    TooltipProps
} from "recharts";
import { TrainingLog } from "./types";
import ExerciseDetail from "./components/ExerciseDetail";


// Green/Nature Tones for Bruce
const BRUCE_COLORS = ["#6b8b7e", "#8bb4a5", "#4f7d6d", "#a4c4b8", "#5c7a6e"];
// Maillard/Earthy Tones for Linda
const LINDA_COLORS = ["#8c6b5d", "#cbb8ae", "#5e4035", "#ac8b7d", "#e6dfd9"];

const DEFAULT_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface DashboardProps {
    user?: string;
    logs: TrainingLog[];
    onLoadDemoData?: () => void;
}

export default function Dashboard({ user, logs, onLoadDemoData }: DashboardProps) {
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    const chartColors = useMemo(() => {
        if (user === "Linda") return LINDA_COLORS;
        if (user === "Bruce") return BRUCE_COLORS;
        return DEFAULT_COLORS;
    }, [user]);

    const primaryColor = chartColors[0];

    // Auto-scroll to detail view when selected
    useEffect(() => {
        if (selectedExercise && detailRef.current) {
            detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [selectedExercise]);

    // 1. Muscle Distribution Data
    const muscleData = useMemo(() => {
        const counts: Record<string, number> = {};
        logs.forEach(log => {
            const muscle = log.targetMuscle || "未分類";
            // Split primarily by comma or slash if multiple muscles are listed (optional, simplified for now)
            counts[muscle] = (counts[muscle] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort by frequency
    }, [logs]);

    // 2. Weekly Workout Frequency (Last 4 Weeks or logical grouping)
    // Let's do a simple "Daily Workout Volume" for the last 14 days for now, or "Workouts per Week".
    // "Workouts per Week" is probably better for general trends.
    const frequencyData = useMemo(() => {
        const weeks: Record<string, number> = {};

        logs.forEach(log => {
            if (!log.currentDate) return;
            const date = new Date(log.currentDate);
            // Get ISO week string or simple "Year-Week"
            const startOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDays = (date.getTime() - startOfYear.getTime()) / 86400000;
            const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
            const key = `W${weekNum}`; // Simplified week label

            weeks[key] = (weeks[key] || 0) + 1;
        });

        // Take last 5 weeks for display
        return Object.entries(weeks)
            .map(([name, count]) => ({ name, count }))
            .slice(-5);
    }, [logs]);

    // Alternative: Workouts per MONTH if data spans long time
    // For now, let's stick to a simple chart: "Top Exercises"
    const topExercises = useMemo(() => {
        const counts: Record<string, number> = {};
        const recentSetsMap: Record<string, string> = {};

        // Sort logs by date ascending first to easily get the "latest"
        const sortedLogs = [...logs].sort((a, b) => new Date(a.currentDate).getTime() - new Date(b.currentDate).getTime());

        sortedLogs.forEach(log => {
            const name = log.actionZh;
            counts[name] = (counts[name] || 0) + 1;

            // Store the most recent sets info
            // Format example: "50kg@12 | 50kg@10"
            const setsStr = log.sets
                .filter(s => s.weight && s.reps)
                .map(s => `${s.weight}kg@${s.reps}`)
                .join(" | ");

            if (setsStr) {
                recentSetsMap[name] = setsStr;
            }
        });

        return Object.entries(counts)
            .map(([name, count]) => ({
                name,
                count,
                recentSets: recentSetsMap[name] || "尚無詳細組數"
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [logs]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: 'rgba(50, 50, 50, 0.9)', // Darker background for contrast
                    color: '#fff',
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    minWidth: '150px'
                }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}>{label}</p>
                    <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}>🏆 訓練次數: {data.count}</p>
                    <p style={{ fontSize: '0.85rem', color: '#ddd', marginTop: '6px' }}>📝 最近訓練:</p>
                    <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>{data.recentSets}</p>
                    <p style={{ fontSize: '0.75rem', color: '#bbb', marginTop: '8px', fontStyle: 'italic' }}>(點擊查看詳情)</p>
                </div>
            );
        }
        return null;
    };


    if (logs.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.8 }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "20px" }}>尚無足夠資料來產生圖表</p>
                {onLoadDemoData && (
                    <button
                        onClick={onLoadDemoData}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "var(--primary-color)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "1rem"
                        }}
                    >
                        載入範例資料 (Demo Data)
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ padding: "0 10px", paddingBottom: "80px" }}>

            {/* Chart 1: Muscle Distribution */}
            <section className="card">
                <h3>💪 訓練部位分佈</h3>
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={muscleData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {muscleData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Chart 2: Top Exercises */}
            <section className="card">
                <h3>🏆 最常練的動作 {selectedExercise && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>(已選擇: {selectedExercise})</span>}</h3>
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={topExercises}
                            layout="vertical"
                            margin={{ left: 20 }}
                            onClick={(data: any) => {
                                if (data && data.activePayload && data.activePayload.length > 0) {
                                    setSelectedExercise(data.activePayload[0].payload.name);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                            <Bar dataKey="count" fill={primaryColor} radius={[0, 4, 4, 0]}>
                                {topExercises.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.name === selectedExercise ? "#ff8042" : chartColors[index % chartColors.length]}
                                        stroke={entry.name === selectedExercise ? "#fff" : "none"}
                                        strokeWidth={2}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Detailed View Section */}
            {selectedExercise && (
                <section ref={detailRef} style={{ scrollMarginTop: '20px' }}>
                    <ExerciseDetail
                        exerciseName={selectedExercise}
                        logs={logs}
                        color={primaryColor}
                    />
                </section>
            )}

            {/* Chart 3: Recent Activity Volume (Total Sets per day recently) */}
            <section className="card">
                <h3>🔥 近期訓練量 (組數)</h3>
                {/* Simplified visual for recent logs sets count */}
            </section>

        </div>
    );
}
