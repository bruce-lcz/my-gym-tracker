import { useMemo, useState } from 'react';
import Model from 'react-body-highlighter';
import type { IExerciseData, IMuscleStats } from 'react-body-highlighter';
import { TrainingLog } from '../types';
import { mapChineseToMuscleKey, MuscleKey, MUSCLE_DISPLAY_NAME } from '../muscleMapping';

interface MuscleVisualizerProps {
    logs: TrainingLog[];
    user?: string;
    onMuscleClick?: (muscleName: string, exercises: string[], frequency: number) => void;
}

export default function MuscleVisualizer({ logs, user, onMuscleClick }: MuscleVisualizerProps) {
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [view, setView] = useState<'anterior' | 'posterior'>('anterior');

    // 根據使用者設定主題色
    const muscleColors = useMemo(() => {
        if (user === 'Linda') {
            return ['#cbb8ae', '#ac8b7d', '#8c6b5d', '#5e4035']; // Maillard/Earthy Tones
        } else if (user === 'Bruce') {
            return ['#a4c4b8', '#8bb4a5', '#6b8b7e', '#4f7d6d']; // Green/Nature Tones
        }
        return ['#74b9ff', '#0984e3', '#0066cc', '#004c99']; // Default Blue
    }, [user]);

    // 將訓練紀錄轉換為 body highlighter 所需的格式
    const exerciseData = useMemo((): IExerciseData[] => {
        const exerciseMap = new Map<string, Set<MuscleKey>>();

        // 遍歷所有訓練紀錄，提取動作和對應的肌群
        logs.forEach(log => {
            if (!log.actionZh || !log.targetMuscle) return;

            const muscles = mapChineseToMuscleKey(log.targetMuscle);
            if (muscles.length === 0) return;

            if (!exerciseMap.has(log.actionZh)) {
                exerciseMap.set(log.actionZh, new Set());
            }

            const muscleSet = exerciseMap.get(log.actionZh)!;
            muscles.forEach(m => muscleSet.add(m));
        });

        // 轉換為 IExerciseData 格式
        return Array.from(exerciseMap.entries()).map(([name, muscleSet]) => ({
            name,
            muscles: Array.from(muscleSet),
        }));
    }, [logs]);

    // 計算每個肌群的訓練統計
    const muscleStats = useMemo(() => {
        const stats = new Map<MuscleKey, { exercises: string[], frequency: number }>();

        logs.forEach(log => {
            if (!log.actionZh || !log.targetMuscle) return;

            const muscles = mapChineseToMuscleKey(log.targetMuscle);
            muscles.forEach(muscle => {
                if (!stats.has(muscle)) {
                    stats.set(muscle, { exercises: [], frequency: 0 });
                }
                const stat = stats.get(muscle)!;
                if (!stat.exercises.includes(log.actionZh)) {
                    stat.exercises.push(log.actionZh);
                }
                stat.frequency += 1;
            });
        });

        return stats;
    }, [logs]);

    // 處理肌群點擊事件
    const handleMuscleClick = (data: IMuscleStats) => {
        const { muscle, data: clickData } = data;
        const { exercises, frequency } = clickData;

        setSelectedMuscle(muscle);

        // 觸發父組件的回調
        if (onMuscleClick) {
            onMuscleClick(muscle, exercises, frequency);
        }
    };

    // 如果沒有訓練紀錄，顯示空狀態
    if (logs.length === 0 || exerciseData.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                opacity: 0.6,
            }}>
                <p>尚無訓練數據可顯示</p>
            </div>
        );
    }

    return (
        <div className="muscle-visualizer">
            <div className="muscle-visualizer-controls" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '20px',
            }}>
                <button
                    onClick={() => setView('anterior')}
                    className={view === 'anterior' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                >
                    正面
                </button>
                <button
                    onClick={() => setView('posterior')}
                    className={view === 'posterior' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                >
                    背面
                </button>
            </div>

            <div className="muscle-visualizer-body" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
            }}>
                <Model
                    data={exerciseData}
                    style={{
                        width: '100%',
                        maxWidth: '300px',
                        padding: '20px',
                    }}
                    highlightedColors={muscleColors}
                    onClick={handleMuscleClick}
                    type={view}
                />
            </div>

            {selectedMuscle && muscleStats.has(selectedMuscle as MuscleKey) && (
                <div className="muscle-visualizer-stats" style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>
                        💪 {MUSCLE_DISPLAY_NAME[selectedMuscle as MuscleKey] || selectedMuscle} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                            ({selectedMuscle?.charAt(0).toUpperCase() + selectedMuscle?.slice(1)})
                        </span>
                    </h4>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <p style={{ marginBottom: '8px' }}>
                            <strong>訓練次數：</strong>
                            {muscleStats.get(selectedMuscle as MuscleKey)!.frequency} 次
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                            <strong>相關動作：</strong>
                        </p>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            marginTop: '8px',
                        }}>
                            {muscleStats.get(selectedMuscle as MuscleKey)!.exercises.map((ex, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        padding: '4px 10px',
                                        backgroundColor: 'var(--primary-bg-subtle)',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        color: 'var(--primary-main)',
                                    }}
                                >
                                    {ex}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="muscle-visualizer-legend" style={{
                marginTop: '20px',
                padding: '12px',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
            }}>
                <p>💡 提示：點擊肌群查看詳細訓練資訊</p>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    marginTop: '8px',
                    flexWrap: 'wrap',
                }}>
                    {muscleColors.map((color, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: color,
                                borderRadius: '3px',
                            }} />
                            <span style={{ fontSize: '0.8rem' }}>
                                {idx === 0 ? '低強度' : idx === muscleColors.length - 1 ? '高強度' : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
