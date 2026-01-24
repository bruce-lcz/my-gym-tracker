import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X, Dumbbell, Activity, ChevronUp } from 'lucide-react';
import { Exercise } from '../exerciseData';

interface ExerciseSelectorProps {
    exercises: Exercise[];
    value: string;
    onChange: (value: string) => void;
}

export default function ExerciseSelector({ exercises, value, onChange }: ExerciseSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Group exercises by Body Part
    const groupedExercises = useMemo(() => {
        const groups: Record<string, Exercise[]> = {};
        const order = ["胸部", "背部", "肩部", "下肢", "手臂/核心", "有氧"];

        // Initialize groups in order
        order.forEach(key => groups[key] = []);
        groups["其他"] = []; // Fallback

        exercises.forEach(ex => {
            if (search) {
                // Filter by search
                const match = ex.zh.toLowerCase().includes(search.toLowerCase()) ||
                    ex.en.toLowerCase().includes(search.toLowerCase());
                if (!match) return;
            }

            const key = ex.part || "其他";
            if (!groups[key]) groups[key] = [];
            groups[key].push(ex);
        });

        // Filter out empty groups
        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    }, [exercises, search]);

    const selectedExercise = exercises.find(ex => ex.zh === value);

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            // Check if mobile
            if (window.innerWidth > 768) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }
        }
    }, [isOpen]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return (
        <div className="relative-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {/* Trigger Button - Mimic OS Design */}
            <div
                className="mac-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    border: "1px solid var(--border-input)",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-input)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    transition: "all 0.15s ease",
                    minHeight: "44px"
                    // Removed blue ring on purpose for cleaner look, added hover effect in CSS
                }}
            >
                {selectedExercise ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden" }}>
                        <span style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-primary)" }}>{selectedExercise.zh}</span>
                        {/* Subtitle is hidden in trigger for cleanliness, like standard headers */}
                    </div>
                ) : (
                    <span style={{ color: "var(--text-placeholder)", fontSize: "14px" }}>請選擇動作...</span>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "-2px", color: "var(--text-tertiary)" }}>
                    <ChevronUp size={10} style={{ marginBottom: "-2px" }} />
                    <ChevronDown size={10} />
                </div>
            </div>

            {/* Dropdown Menu - Mac OS / iOS Style */}
            {isOpen && (
                <div
                    className="mac-dropdown-menu"
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        width: "100%",
                        marginTop: "8px",
                        background: "rgba(255, 255, 255, 0.85)", // Glass effect base
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(0,0,0,0.1)",
                        borderRadius: "10px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2) inset",
                        zIndex: 9999,
                        maxHeight: "400px",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        transformOrigin: "top center",
                        animation: "scaleIn 0.15s cubic-bezier(0.2, 0, 0.13, 1.5)"
                    }}
                >
                    {/* Search Bar (Sticky Top) */}
                    <div style={{
                        padding: "8px",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        background: "rgba(255, 255, 255, 0.5)"
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            background: "rgba(0,0,0,0.05)",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            gap: "6px"
                        }}>
                            <Search size={14} color="gray" />
                            <input
                                ref={searchInputRef}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    outline: "none",
                                    width: "100%",
                                    fontSize: "13px",
                                    padding: 0,
                                    color: "var(--text-primary)"
                                }}
                            />
                            {search && (
                                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                                    <X size={14} color="gray" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grouped List */}
                    <div
                        ref={listRef}
                        style={{
                            overflowY: "auto",
                            flex: 1,
                            padding: "6px 6px"
                        }}
                    >
                        {groupedExercises.length === 0 ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "gray", fontSize: "13px" }}>No results</div>
                        ) : (
                            groupedExercises.map(([category, groupItems]) => (
                                <div key={category} style={{ marginBottom: "4px" }}>
                                    {/* Category Header - Mac Style (Gray text, reduced padding) */}
                                    <div style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#8e8e93", // Apple gray
                                        padding: "6px 10px 2px 10px",
                                        marginLeft: "4px"
                                        // letterSpacing: "0.5px"
                                    }}>
                                        {category}
                                    </div>

                                    {/* Items */}
                                    <div>
                                        {groupItems.map((ex) => {
                                            const isSelected = selectedExercise?.zh === ex.zh;
                                            return (
                                                <div
                                                    key={ex.zh}
                                                    onClick={() => {
                                                        onChange(ex.zh);
                                                        setIsOpen(false);
                                                        setSearch("");
                                                    }}
                                                    className="mac-menu-item"
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        padding: "6px 12px 6px 26px", // Indent for checkmark space? Or just standard
                                                        borderRadius: "4px",
                                                        fontSize: "13px",
                                                        cursor: "default", // Mac menus use default cursor usually
                                                        color: isSelected ? "white" : "var(--text-primary)",
                                                        background: isSelected ? "#007AFF" : "transparent", // System Blue
                                                        position: "relative",
                                                        transition: "background 0.0s" // Instant
                                                    }}
                                                >
                                                    {/* Custom Checkmark positioning */}
                                                    {isSelected && (
                                                        <Check
                                                            size={14}
                                                            strokeWidth={3}
                                                            style={{
                                                                position: "absolute",
                                                                left: "8px",
                                                                color: "white"
                                                            }}
                                                        />
                                                    )}

                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
                                                        <span style={{ fontWeight: 400 }}>{ex.zh}</span>
                                                        <span style={{
                                                            fontSize: "11px",
                                                            color: isSelected ? "rgba(255,255,255,0.8)" : "#8e8e93",
                                                            marginTop: "0px"
                                                        }}>
                                                            {ex.en}
                                                        </span>
                                                    </div>

                                                    {/* Type Icon (Subtle) */}
                                                    {ex.type === "cardio" && (
                                                        <Activity size={12} style={{ opacity: 0.6 }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Divider if not last */}
                                    {/* <div style={{ height: "1px", background: "rgba(0,0,0,0.05)", margin: "4px 10px" }} /> */}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                .mac-menu-item:hover {
                    background-color: ${'var(--primary-main)'}; /* Use App Theme or fallback to system blue on hover if not selected ? No, Mac menus blue highlight on hover */
                }

                /* Override hover for non-selected items to look like selection */
                .mac-menu-item:not([style*="background: rgb(0, 122, 255)"]):hover {
                    background-color: #007AFF !important;
                    color: white !important;
                }
                
                /* When hovering a non-selected item, we need to make sure its children text turn white */
                .mac-menu-item:hover span {
                    color: white !important;
                }

                [data-theme="dark"] .mac-dropdown-menu {
                    background: rgba(40, 40, 40, 0.85) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }

                [data-theme="dark"] .mac-menu-item:not([style*="background: rgb(0, 122, 255)"]):hover {
                    background-color: #0A84FF !important; /* Dark mode blue */
                }
            `}</style>
        </div>
    );
}
