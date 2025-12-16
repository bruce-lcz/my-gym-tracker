export interface Exercise {
  zh: string;
  en: string;
  targetMuscle: string;
}

export const DEFAULT_EXERCISES: Exercise[] = [
  { zh: "羅馬尼亞硬舉", en: "Romanian Deadlift", targetMuscle: "腿後肌群" },
  { zh: "槓鈴臥推", en: "Barbell Bench Press", targetMuscle: "胸大肌" },
  { zh: "過頭肩推", en: "Overhead Press", targetMuscle: "三角肌前中束" },
  { zh: "腿屈伸", en: "Leg Extension", targetMuscle: "股四頭肌" },
  { zh: "頸後深蹲", en: "Back Squat", targetMuscle: "股四頭肌" },
  { zh: "胸上緣", en: "Incline Press", targetMuscle: "胸大肌上緣" },
  { zh: "股四頭肌", en: "Quad Exercise", targetMuscle: "股四頭肌" },
  { zh: "背闊肌", en: "Lat Pulldown", targetMuscle: "背闊肌" },
];

export function loadExercises(): Exercise[] {
  const stored = localStorage.getItem("customExercises");
  if (stored) {
    try {
      const custom = JSON.parse(stored) as Exercise[];
      return [...DEFAULT_EXERCISES, ...custom];
    } catch {
      return DEFAULT_EXERCISES;
    }
  }
  return DEFAULT_EXERCISES;
}

export function saveCustomExercise(exercise: Exercise): void {
  const stored = localStorage.getItem("customExercises");
  let custom: Exercise[] = [];
  if (stored) {
    try {
      custom = JSON.parse(stored) as Exercise[];
    } catch {
      custom = [];
    }
  }
  custom.push(exercise);
  localStorage.setItem("customExercises", JSON.stringify(custom));
}

