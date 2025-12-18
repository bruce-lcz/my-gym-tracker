import { useMemo } from "react";
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
    CartesianGrid
} from "recharts";
import { TrainingLog } from "./types";

interface DashboardProps {
    logs: TrainingLog[];
    onLoadDemoData?: () => void;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];

export default function Dashboard({ logs, onLoadDemoData }: DashboardProps) {
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
        logs.forEach(log => {
            const name = log.actionZh;
            counts[name] = (counts[name] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [logs]);


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
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <h3>🏆 最常練的動作</h3>
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={topExercises} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                {topExercises.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Chart 3: Recent Activity Volume (Total Sets per day recently) */}
            <section className="card">
                <h3>🔥 近期訓練量 (組數)</h3>
                {/* Simplified visual for recent logs sets count */}
            </section>

        </div>
    );
}
