import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Dumbbell,
    Zap,
    X,
    Save,
    Loader2,
    Sparkles,
    RefreshCw
} from 'lucide-react';
import {
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise
} from '../api';
import { translateExercise } from '../llmService';
import './ExerciseManager.css';

interface Exercise {
    zh: string;
    en: string;
    targetMuscle: string;
    type?: "strength" | "cardio";
    part?: string;
}

const ExerciseManager: React.FC = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [originalZh, setOriginalZh] = useState<string>(""); // Track original name for updates

    // Form State
    const [formData, setFormData] = useState<Exercise>({
        zh: "",
        en: "",
        targetMuscle: "",
        type: "strength"
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Initial Data
    const loadData = async () => {
        setLoading(true);
        const res = await fetchExercises();
        if (res.ok && res.data) {
            setExercises(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter Logic
    const filteredExercises = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return exercises.filter(ex =>
            ex.zh.toLowerCase().includes(term) ||
            ex.en.toLowerCase().includes(term) ||
            ex.targetMuscle.toLowerCase().includes(term)
        );
    }, [exercises, searchTerm]);

    // Handlers
    const handleOpenAdd = () => {
        setEditingExercise(null);
        setFormData({ zh: "", en: "", targetMuscle: "", type: "strength" });
        setIsModalOpen(true);
        setError(null);
    };

    const handleOpenEdit = (ex: Exercise) => {
        setEditingExercise(ex);
        setOriginalZh(ex.zh);
        setFormData({ ...ex });
        setIsModalOpen(true);
        setError(null);
    };

    const handleDelete = async (zh: string) => {
        if (!window.confirm(`確定要刪除動作「${zh}」嗎？此操作無法復原。`)) return;

        setDeleting(true);
        const res = await deleteExercise({ zh });
        setDeleting(false);

        if (res.ok) {
            setExercises(prev => prev.filter(e => e.zh !== zh));
        } else {
            alert("刪除失敗: " + res.error);
        }
    };

    const handleTranslate = async () => {
        if (!formData.en.trim()) {
            setError("請先輸入英文動作名稱");
            return;
        }
        setTranslating(true);
        const res = await translateExercise(formData.en);
        setTranslating(false);

        if (res.ok && res.data) {
            setFormData(prev => ({
                ...prev,
                zh: res.data!.chineseName,
                targetMuscle: res.data!.targetMuscle
            }));
            setError(null);
        } else {
            setError(res.error || "翻譯失敗");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.zh || !formData.targetMuscle) {
            setError("請填寫完整資訊");
            return;
        }

        setSaving(true);
        setError(null);

        let res;
        if (editingExercise) {
            // Update
            res = await updateExercise({
                originalZh: originalZh,
                ...formData
            });
        } else {
            // Create
            res = await createExercise(formData);
        }

        setSaving(false);

        if (res.ok) {
            setIsModalOpen(false);
            loadData(); // Reload to sync
        } else {
            setError(res.error || "儲存失敗");
        }
    };

    return (
        <div className="exercise-manager-container fade-in">
            <div className="manager-header">
                <h2>
                    <Dumbbell className="text-primary" />
                    動作管理
                </h2>
                <button className="btn-primary" onClick={handleOpenAdd}>
                    <Plus size={18} style={{ marginRight: 6 }} />
                    新增動作
                </button>
            </div>

            <div className="search-bar">
                <Search size={20} />
                <input
                    placeholder="搜尋動作、英文名稱或肌群..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                {loading && <RefreshCw className="spin" size={18} />}
            </div>

            {loading && exercises.length === 0 ? (
                <div className="loading-container">
                    <Loader2 className="spin" size={40} />
                    <p>載入動作資料中...</p>
                </div>
            ) : filteredExercises.length === 0 ? (
                <div className="empty-state">
                    <p>找不到符合的動作</p>
                </div>
            ) : (
                <div className="exercise-grid">
                    {filteredExercises.map((ex, idx) => (
                        <div key={`${ex.zh}-${idx}`} className="exercise-card">
                            <div className="exercise-card-header">
                                <div>
                                    <div className="exercise-title">{ex.zh}</div>
                                    <div className="exercise-en">{ex.en || "-"}</div>
                                </div>
                                <div className="card-actions">
                                    <button
                                        className="action-btn"
                                        onClick={() => handleOpenEdit(ex)}
                                        title="編輯"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="action-btn delete"
                                        onClick={() => handleDelete(ex.zh)}
                                        title="刪除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="exercise-tags">
                                <div className="tag muscle">
                                    <Zap size={12} fill="currentColor" />
                                    {ex.targetMuscle}
                                </div>
                                {ex.type && (
                                    <div className="tag type">
                                        {ex.type === 'cardio' ? '有氧' : '重訓'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit/Add Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingExercise ? "編輯動作" : "新增動作"}</h3>
                            <button
                                className="action-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>英文名稱 (輸入後可 AI 自動生成)</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        value={formData.en}
                                        onChange={e => setFormData(p => ({ ...p, en: e.target.value }))}
                                        placeholder="e.g. Bench Press"
                                    />
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        style={{ padding: '0 12px', background: 'var(--accent-color)' }}
                                        onClick={handleTranslate}
                                        disabled={translating}
                                        title="AI 生成中文與肌群"
                                    >
                                        {translating ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>中文名稱 *</label>
                                <input
                                    value={formData.zh}
                                    onChange={e => setFormData(p => ({ ...p, zh: e.target.value }))}
                                    placeholder="e.g. 臥推"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>目標肌群 *</label>
                                <input
                                    value={formData.targetMuscle}
                                    onChange={e => setFormData(p => ({ ...p, targetMuscle: e.target.value }))}
                                    placeholder="e.g. 胸大肌"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>類型</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}
                                >
                                    <option value="strength">重量訓練 (Strength)</option>
                                    <option value="cardio">有氧 (Cardio)</option>
                                </select>
                            </div>

                            {error && <p style={{ color: '#ff3b30', fontSize: '0.9rem' }}>{error}</p>}

                            <div className="btn-row">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                                    取消
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Loader2 className="spin" size={16} /> 儲存中
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Save size={16} /> 儲存
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExerciseManager;
