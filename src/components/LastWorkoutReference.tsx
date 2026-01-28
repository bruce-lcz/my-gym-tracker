import { TrainingLog } from "../types";
import { Calendar, TrendingUp, Hash, Activity } from "lucide-react";
import "./LastWorkoutReference.css";

interface LastWorkoutReferenceProps {
    lastWorkout: TrainingLog | null;
    onApplyWeight: (weight: string) => void;
    onIncrementWeight: (increment: number) => void;
}

export default function LastWorkoutReference({
    lastWorkout,
    onApplyWeight,
    onIncrementWeight
}: LastWorkoutReferenceProps) {
    if (!lastWorkout) return null;

    // Logic: Use the weight from the 2nd to last set (or last set if < 2)
    // Users prefer this over average as it represents their "working set" weight better
    const validSets = lastWorkout.sets.filter(s => parseFloat(s.weight || "0") > 0);

    let referenceWeight = "0";
    if (validSets.length > 0) {
        // If we have at least 2 sets, pick the 2nd to last one
        if (validSets.length >= 2) {
            referenceWeight = validSets[validSets.length - 2].weight;
        } else {
            referenceWeight = validSets[0].weight;
        }
    }

    // Get max weight for stats
    const weights = validSets.map(s => parseFloat(s.weight || "0"));
    const maxWeight = weights.length > 0
        ? Math.max(...weights).toFixed(1)
        : "0";

    // Calculate total reps
    const totalReps = lastWorkout.sets
        .map(s => parseInt(s.reps || "0"))
        .filter(r => r > 0)
        .reduce((a, b) => a + b, 0);

    return (
        <div className="last-workout-reference">
            <div className="reference-header">
                <div className="reference-title">
                    <TrendingUp size={16} />
                    <span>上次訓練參考</span>
                </div>
                <div className="reference-date">
                    <Calendar size={14} />
                    <span>{lastWorkout.currentDate}</span>
                </div>
            </div>

            <div className="reference-stats">
                <div className="stat-item">
                    <span className="stat-label">上次重量</span>
                    <span className="stat-value">{referenceWeight} kg</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">最大重量</span>
                    <span className="stat-value">{maxWeight} kg</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">總組數</span>
                    <span className="stat-value">{lastWorkout.sets.length} 組</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">總次數</span>
                    <span className="stat-value">{totalReps} 次</span>
                </div>
            </div>

            <div className="reference-sets">
                <div className="sets-header">訓練詳情</div>
                <div className="sets-list">
                    {lastWorkout.sets.map((set, idx) => {
                        // Highlight the reference set
                        const isRef = (validSets.length >= 2 && validSets[validSets.length - 2] === set) ||
                            (validSets.length < 2 && validSets[0] === set);
                        return (
                            <div key={idx} className="set-detail" style={isRef ? { borderColor: "var(--primary-main)", background: "var(--primary-bg-subtle)" } : {}}>
                                <span className="set-number">Set {idx + 1}</span>
                                <span className="set-data">{set.weight}kg × {set.reps}次</span>
                                {isRef && <span style={{ fontSize: "0.7rem", color: "var(--primary-main)", marginLeft: "4px" }}>(參考)</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="reference-actions">
                <button
                    type="button"
                    className="btn-reference"
                    onClick={() => onApplyWeight(referenceWeight)}
                    title={`使用 ${referenceWeight}kg`}
                >
                    使用 {referenceWeight}kg
                </button>
                <button
                    type="button"
                    className="btn-reference btn-increment"
                    onClick={() => onIncrementWeight(2.5)}
                    title="參考重量 +2.5kg"
                >
                    +2.5kg
                </button>
                <button
                    type="button"
                    className="btn-reference btn-increment"
                    onClick={() => onIncrementWeight(5)}
                    title="參考重量 +5kg"
                >
                    +5kg
                </button>
                <button
                    type="button"
                    className="btn-reference btn-increment"
                    onClick={() => onIncrementWeight(10)}
                    title="參考重量 +10kg"
                >
                    +10kg
                </button>
            </div>

            {lastWorkout.rpe && (
                <div className="reference-note">
                    <Activity size={14} />
                    <span>上次 RPE: {lastWorkout.rpe}</span>
                </div>
            )}
        </div>
    );
}
