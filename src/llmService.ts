import OpenAI from "openai";

export interface ExerciseTranslation {
    chineseName: string;
    targetMuscle: string;
}

/**
 * 使用 LLM 將英文動作名稱翻譯為中文，並識別訓練肌群
 * @param englishName 英文動作名稱
 * @returns 包含中文名稱和訓練肌群的物件
 */
export async function translateExercise(englishName: string): Promise<{ ok: boolean; data?: ExerciseTranslation; error?: string }> {
    try {
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;

        if (!apiKey) {
            return {
                ok: false,
                error: "未設定 GROQ_API_KEY，請在 .env.local 中設定 VITE_GROQ_API_KEY"
            };
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1",
            dangerouslyAllowBrowser: true,
        });

        const response = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `你是一位專業的健身教練。你的任務是根據英文健身動作名稱，生成對應的繁體中文名稱並識別該動作主要訓練的肌群。

                    **重要規則：**
                    1. 必須使用**繁體中文**
                    2. 翻譯要準確且符合健身界常用術語
                    3. 肌群名稱要精確（例如：胸大肌、腿後肌群、三角肌前束、三角肌中束、三角肌前中束、闊背肌、肱三頭肌、股四頭肌等）
                    4. 如果是有氧運動，肌群填寫「心肺」或相關肌群組合（例如：股四頭肌、心肺）
                    5. **回應格式必須是純 JSON**，不要有任何其他文字或 markdown 標記

                    **參考範例：**
                    - Cable Triceps Pushdown → {"chineseName": "滑輪三頭下壓", "targetMuscle": "肱三頭肌"}
                    - Overhead Press → {"chineseName": "過頭肩推", "targetMuscle": "三角肌前中束"}
                    - Leg Extension → {"chineseName": "腿屈伸", "targetMuscle": "股四頭肌"}
                    - Triceps Press → {"chineseName": "器械三頭下壓", "targetMuscle": "肱三頭肌"}
                    - Shoulder Press → {"chineseName": "器械肩推", "targetMuscle": "三角肌"}
                    - Lateral Raise → {"chineseName": "器械側平舉", "targetMuscle": "三角肌中束"}
                    - Chest Press → {"chineseName": "器械推胸", "targetMuscle": "胸大肌"}
                    - Stair Climber → {"chineseName": "爬梯機", "targetMuscle": "股四頭肌、心肺"}
                    - Treadmill → {"chineseName": "跑步機", "targetMuscle": "心肺"}
                    - Elliptical → {"chineseName": "滑步機", "targetMuscle": "心肺"}

                    **回應格式：**
                    {"chineseName": "中文名稱", "targetMuscle": "主要肌群"}`
                },
                {
                    role: "user",
                    content: `請根據這個英文動作名稱生成中文名稱和訓練肌群：${englishName}`
                }
            ],
            temperature: 0.3,
            max_completion_tokens: 150,
        });

        const aiResponse = response.choices?.[0]?.message?.content?.trim();

        if (!aiResponse) {
            return {
                ok: false,
                error: "LLM 未返回結果"
            };
        }

        // 嘗試解析 JSON 回應
        try {
            // 清理可能的 markdown code block 標記
            let cleanedResponse = aiResponse;
            if (aiResponse.includes('```')) {
                cleanedResponse = aiResponse
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();
            }

            const parsed = JSON.parse(cleanedResponse) as ExerciseTranslation;

            // 驗證回應格式
            if (!parsed.chineseName || !parsed.targetMuscle) {
                return {
                    ok: false,
                    error: "LLM 回應格式不正確"
                };
            }

            return {
                ok: true,
                data: parsed
            };
        } catch (parseError) {
            console.error("解析 LLM 回應失敗:", aiResponse, parseError);
            return {
                ok: false,
                error: `無法解析 LLM 回應: ${aiResponse}`
            };
        }

    } catch (error) {
        console.error("LLM 翻譯錯誤:", error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : "LLM 服務錯誤"
        };
    }
}
