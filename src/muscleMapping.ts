/**
 * 肌群名稱映射配置
 * 將中文肌群名稱映射到 react-body-highlighter 支援的英文肌群標識
 */

// react-body-highlighter 支援的肌群標識
export type MuscleKey =
    | 'chest'
    | 'biceps'
    | 'triceps'
    | 'forearm'
    | 'back-deltoids'
    | 'front-deltoids'
    | 'abs'
    | 'obliques'
    | 'adductor'
    | 'hamstring'
    | 'quadriceps'
    | 'abductors'
    | 'calves'
    | 'gluteal'
    | 'head'
    | 'neck'
    | 'trapezius'
    | 'upper-back'
    | 'lower-back';

/**
 * 英文肌群標識對應的中文顯示名稱
 */
export const MUSCLE_DISPLAY_NAME: Record<MuscleKey, string> = {
    'chest': '胸大肌',
    'biceps': '二頭肌',
    'triceps': '三頭肌',
    'forearm': '前臂',
    'back-deltoids': '後三角肌',
    'front-deltoids': '前三角肌',
    'abs': '腹肌',
    'obliques': '腹斜肌',
    'adductor': '內收肌群',
    'hamstring': '膕繩肌 (後腿)',
    'quadriceps': '股四頭肌 (前腿)',
    'abductors': '外展肌群',
    'calves': '小腿肌群',
    'gluteal': '臀部肌群',
    'head': '頭部',
    'neck': '頸部',
    'trapezius': '斜方肌',
    'upper-back': '上背肌群',
    'lower-back': '下背肌群'
};

/**
 * 中文肌群名稱到英文標識的映射表
 * 支援多對一映射（多個中文名稱可能對應同一個英文標識）
 */
export const MUSCLE_MAPPING: Record<string, MuscleKey[]> = {
    // 胸部
    '胸': ['chest'],
    '胸大肌': ['chest'],
    '胸肌': ['chest'],
    '上胸': ['chest'],
    '中胸': ['chest'],
    '下胸': ['chest'],

    // 背部
    '背': ['upper-back', 'lower-back'],
    '背肌': ['upper-back', 'lower-back'],
    '上背': ['upper-back'],
    '中背': ['upper-back'],
    '下背': ['lower-back'],
    '背闊肌': ['upper-back'],
    '斜方肌': ['trapezius'],
    '上斜方': ['trapezius'],
    '中斜方': ['trapezius'],
    '下斜方': ['trapezius'],

    // 肩膀
    '肩': ['front-deltoids', 'back-deltoids'],
    '肩膀': ['front-deltoids', 'back-deltoids'],
    '三角肌': ['front-deltoids', 'back-deltoids'],
    '前三角': ['front-deltoids'],
    '中三角': ['front-deltoids', 'back-deltoids'],
    '後三角': ['back-deltoids'],
    '前束': ['front-deltoids'],
    '中束': ['front-deltoids', 'back-deltoids'],
    '後束': ['back-deltoids'],

    // 手臂
    '二頭': ['biceps'],
    '二頭肌': ['biceps'],
    '肱二頭': ['biceps'],
    '肱二頭肌': ['biceps'],
    '三頭': ['triceps'],
    '三頭肌': ['triceps'],
    '肱三頭': ['triceps'],
    '肱三頭肌': ['triceps'],
    '前臂': ['forearm'],
    '小臂': ['forearm'],

    // 核心
    '腹': ['abs'],
    '腹肌': ['abs'],
    '腹直肌': ['abs'],
    '上腹': ['abs'],
    '下腹': ['abs'],
    '側腹': ['obliques'],
    '腹斜肌': ['obliques'],
    '腹內斜肌': ['obliques'],
    '腹外斜肌': ['obliques'],
    '核心': ['abs', 'obliques'],

    // 腿部
    '腿': ['quadriceps', 'hamstring'],
    '大腿': ['quadriceps', 'hamstring'],
    '股四頭': ['quadriceps'],
    '股四頭肌': ['quadriceps'],
    '前腿': ['quadriceps'],
    '股二頭': ['hamstring'],
    '股二頭肌': ['hamstring'],
    '後腿': ['hamstring'],
    '膕繩肌': ['hamstring'],
    '小腿': ['calves'],
    '腓腸肌': ['calves'],
    '比目魚肌': ['calves'],
    '臀': ['gluteal'],
    '臀部': ['gluteal'],
    '臀大肌': ['gluteal'],
    '臀中肌': ['gluteal'],
    '臀小肌': ['gluteal'],
    '內收肌': ['adductor'],
    '外展肌': ['abductors'],

    // 其他
    '頸': ['neck'],
    '頸部': ['neck'],
    '頭': ['head'],
};

/**
 * 將中文肌群名稱轉換為 body highlighter 支援的英文標識
 * @param chineseName 中文肌群名稱
 * @returns 對應的英文肌群標識陣列，如果找不到則返回空陣列
 */
export function mapChineseToMuscleKey(chineseName: string): MuscleKey[] {
    if (!chineseName) return [];

    // 移除空白字符
    const trimmedName = chineseName.trim();

    // 精確匹配
    if (MUSCLE_MAPPING[trimmedName]) {
        return MUSCLE_MAPPING[trimmedName];
    }

    // 模糊匹配（包含關鍵字）
    const matchedKeys: MuscleKey[] = [];
    for (const [key, muscles] of Object.entries(MUSCLE_MAPPING)) {
        if (trimmedName.includes(key) || key.includes(trimmedName)) {
            matchedKeys.push(...muscles);
        }
    }

    // 去重
    return Array.from(new Set(matchedKeys));
}

/**
 * 批次轉換多個中文肌群名稱
 * @param chineseNames 中文肌群名稱陣列或逗號分隔的字串
 * @returns 所有對應的英文肌群標識陣列（已去重）
 */
export function mapMultipleMuscles(chineseNames: string | string[]): MuscleKey[] {
    const names = typeof chineseNames === 'string'
        ? chineseNames.split(/[,，、]/).map(n => n.trim())
        : chineseNames;

    const allMuscles = names.flatMap(name => mapChineseToMuscleKey(name));
    return Array.from(new Set(allMuscles));
}
