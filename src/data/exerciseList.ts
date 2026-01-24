export const EXERCISE_CATEGORIES: Record<string, Array<{ zh: string; en: string; targetMuscle: string; type: "strength" | "cardio" }>> = {
    "下肢": [
        { zh: "大腿推蹬", en: "Seated Leg Press", targetMuscle: "股四頭肌、臀大肌", type: "strength" },
        { zh: "腿屈伸", en: "Leg Extension", targetMuscle: "股四頭肌", type: "strength" },
        { zh: "坐式小腿", en: "Horizontal Calf", targetMuscle: "腓腸肌、比目魚肌", type: "strength" },
        { zh: "坐式腿後彎", en: "Seated Leg Curl", targetMuscle: "腿後肌群", type: "strength" },
        { zh: "髖關節外展", en: "Hip Abduction", targetMuscle: "臀大肌、臀中肌", type: "strength" },
        { zh: "股四頭肌訓練", en: "Quad Exercise", targetMuscle: "股四頭肌", type: "strength" },
        { zh: "坐姿夾腿機 (髖內收)", en: "Hip Adduction Machine", targetMuscle: "內收肌群", type: "strength" },
    ],
    "胸部": [
        { zh: "器械推胸", en: "Chest Press", targetMuscle: "胸大肌", type: "strength" },
        { zh: "坐姿蝴蝶機夾胸", en: "Pec Deck Fly", targetMuscle: "胸大肌 (中縫/輪廓)", type: "strength" },
        { zh: "下斜推胸", en: "Decline Press", targetMuscle: "胸大肌下緣", type: "strength" },
        { zh: "胸上緣 (上斜推舉)", en: "Incline Press", targetMuscle: "胸大肌上緣", type: "strength" },
        { zh: "匯聚式推胸", en: "Converging Chest Press", targetMuscle: "胸大肌", type: "strength" },
    ],
    "肩部": [
        { zh: "器械側平舉", en: "Lateral Raise", targetMuscle: "三角肌中束", type: "strength" },
        { zh: "器械肩推", en: "Shoulder Press", targetMuscle: "三角肌前、中束", type: "strength" },
        { zh: "過頭肩推", en: "Overhead Press", targetMuscle: "三角肌前、中束", type: "strength" },
    ],
    "背部": [
        { zh: "坐姿划船", en: "Seated Cable Row", targetMuscle: "背闊肌、菱形肌", type: "strength" },
        { zh: "背闊肌滑輪下拉", en: "Lat Pulldown", targetMuscle: "背闊肌", type: "strength" },
        { zh: "引體向上/撐體機", en: "Dip/Chin-up Assist", targetMuscle: "背闊肌、胸大肌、三頭肌", type: "strength" },
        { zh: "45度下背伸展", en: "45-degree Back Extension", targetMuscle: "豎脊肌、臀大肌", type: "strength" },
    ],
    "手臂/核心": [
        { zh: "腹部訓練機", en: "Abdominal Crunch", targetMuscle: "腹直肌 (核心)", type: "strength" },
        { zh: "三頭訓練機", en: "Triceps Extension", targetMuscle: "肱三頭肌", type: "strength" },
        { zh: "滑輪三頭下壓", en: "Cable Triceps Pushdown", targetMuscle: "肱三頭肌", type: "strength" },
        { zh: "二頭彎舉", en: "Biceps Curl", targetMuscle: "肱二頭肌", type: "strength" },
        { zh: "器械三頭下壓", en: "Triceps Press", targetMuscle: "肱三頭肌", type: "strength" },
    ],
    "有氧": [
        { zh: "爬梯機", en: "Stair Climber", targetMuscle: "股四頭肌、心肺", type: "cardio" },
        { zh: "跑步機", en: "Treadmill", targetMuscle: "心肺", type: "cardio" },
        { zh: "滑步機", en: "Elliptical", targetMuscle: "心肺", type: "cardio" },
    ]
};

// Flattened list for lookup
export const PREDEFINED_EXERCISES_LIST = Object.entries(EXERCISE_CATEGORIES).flatMap(([part, exercises]) =>
    exercises.map(ex => ({ ...ex, part }))
);
