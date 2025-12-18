import { TrainingLog } from "./types";

export const MOCK_LOGS: TrainingLog[] = [
    {
        id: "mock-1",
        actionZh: "深蹲",
        actionEn: "Squat",
        targetMuscle: "腿部",
        currentDate: "2023-11-20",
        sets: [{ weight: "100", reps: "5" }, { weight: "100", reps: "5" }, { weight: "100", reps: "5" }],
        rpe: "8",
        notes: "狀態不錯",
        nextTarget: "102.5kg",
        createdAt: new Date("2023-11-20").toISOString()
    },
    {
        id: "mock-2",
        actionZh: "臥推",
        actionEn: "Bench Press",
        targetMuscle: "胸部",
        currentDate: "2023-11-21",
        sets: [{ weight: "80", reps: "8" }, { weight: "80", reps: "8" }, { weight: "80", reps: "7" }],
        rpe: "9",
        notes: "肩膀有點緊",
        nextTarget: "80kg 3x8",
        createdAt: new Date("2023-11-21").toISOString()
    },
    {
        id: "mock-3",
        actionZh: "硬舉",
        actionEn: "Deadlift",
        targetMuscle: "背部",
        currentDate: "2023-11-22",
        sets: [{ weight: "120", reps: "5" }, { weight: "120", reps: "5" }],
        rpe: "8.5",
        notes: "",
        nextTarget: "125kg",
        createdAt: new Date("2023-11-22").toISOString()
    },
    {
        id: "mock-4",
        actionZh: "深蹲",
        actionEn: "Squat",
        targetMuscle: "腿部",
        currentDate: "2023-11-24",
        sets: [{ weight: "102.5", reps: "5" }, { weight: "102.5", reps: "5" }, { weight: "102.5", reps: "4" }],
        rpe: "9.5",
        notes: "最後一組力竭",
        nextTarget: "102.5kg 3x5",
        createdAt: new Date("2023-11-24").toISOString()
    },
    {
        id: "mock-5",
        actionZh: "啞鈴肩推",
        actionEn: "Dumbbell Shoulder Press",
        targetMuscle: "肩膀",
        currentDate: "2023-11-25",
        sets: [{ weight: "20", reps: "10" }, { weight: "20", reps: "9" }, { weight: "20", reps: "8" }],
        rpe: "9",
        notes: "",
        createdAt: new Date("2023-11-25").toISOString()
    },
    {
        id: "mock-6",
        actionZh: "引體向上",
        actionEn: "Pull Up",
        targetMuscle: "背部",
        currentDate: "2023-11-26",
        sets: [{ weight: "0", reps: "10" }, { weight: "0", reps: "8" }, { weight: "0", reps: "7" }],
        rpe: "9",
        notes: "",
        createdAt: new Date("2023-11-26").toISOString()
    },
    {
        id: "mock-7",
        actionZh: "臥推",
        actionEn: "Bench Press",
        targetMuscle: "胸部",
        currentDate: "2023-11-28",
        sets: [{ weight: "82.5", reps: "5" }, { weight: "82.5", reps: "5" }, { weight: "82.5", reps: "5" }],
        rpe: "8.5",
        notes: "突破平台期",
        createdAt: new Date("2023-11-28").toISOString()
    },
    {
        id: "mock-8",
        actionZh: "二頭彎舉",
        actionEn: "Bicep Curl",
        targetMuscle: "手臂",
        currentDate: "2023-11-28",
        sets: [{ weight: "15", reps: "12" }, { weight: "15", reps: "10" }],
        rpe: "9",
        createdAt: new Date("2023-11-28").toISOString()
    },
    {
        id: "mock-9",
        actionZh: "深蹲",
        actionEn: "Squat",
        targetMuscle: "腿部",
        currentDate: "2023-12-01",
        sets: [{ weight: "102.5", reps: "5" }, { weight: "102.5", reps: "5" }, { weight: "102.5", reps: "5" }],
        rpe: "9",
        notes: "成功完成",
        createdAt: new Date("2023-12-01").toISOString()
    },
    {
        id: "mock-10",
        actionZh: "三頭下壓",
        actionEn: "Tricep Pushdown",
        targetMuscle: "手臂",
        currentDate: "2023-12-01",
        sets: [{ weight: "25", reps: "12" }, { weight: "25", reps: "12" }],
        rpe: "8",
        createdAt: new Date("2023-12-01").toISOString()
    }
];
