
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Always use named parameter for apiKey and obtain it from process.env.API_KEY
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface CreativeGroupName {
  name: string;
  description: string;
}

/**
 * Generates creative group names using Gemini AI.
 */
export const generateCreativeGroupNames = async (count: number, context?: string): Promise<CreativeGroupName[]> => {
  const ai = getAI();
  const prompt = `
    你是一位專業的 HR 活動策劃師。
    任務：為一場公司活動生成 ${count} 個小組的名稱與描述。
    
    命名規範：
    - 所有小組名稱必須嚴格按照「第一組」、「第二組」... 的序號排列。
    
    描述規範：
    - 根據活動背景「${context || "團隊建設日"}」，為每一組寫一段簡短、專業且具備激勵性的描述（繁體中文）。
    
    請以 JSON 格式回傳，結構為：[{"name": "第一組", "description": "..."}, ...]
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "description"]
          }
        }
      }
    });

    // Access .text property directly as per Gemini API guidelines
    const responseText = response.text?.trim();
    if (!responseText) throw new Error("Empty response");
    return JSON.parse(responseText) as CreativeGroupName[];
  } catch (e) {
    console.error("AI Grouping failed, using fallback", e);
    return Array.from({ length: count }, (_, i) => ({
      name: `${getChineseNumber(i + 1)}組`,
      description: "充滿活力與專業精神的團隊"
    }));
  }
};

function getChineseNumber(n: number): string {
  const chineseNums = ['零', '第一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九', '第十'];
  return n <= 10 ? chineseNums[n] : `第 ${n} `;
}
