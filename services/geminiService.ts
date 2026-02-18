
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define interface for AI generated group names to provide strong typing
export interface CreativeGroupName {
  name: string;
  description: string;
}

/**
 * Generates creative group names using Gemini AI.
 * Returns a list of group names and descriptions.
 */
export const generateCreativeGroupNames = async (count: number, context?: string): Promise<CreativeGroupName[]> => {
  const prompt = `
    你是一位專業的 HR 活動策劃師。
    任務：為一場公司活動生成 ${count} 個小組的名稱與描述。
    
    命名規範（非常重要）：
    - 所有小組名稱必須嚴格按照「第一組」、「第二組」、「第三組」... 的序號排列。
    - 嚴禁使用其他創意名稱作為標題，標題必須僅包含組別序號。
    
    描述規範：
    - 根據活動背景「${context || "團隊建設日"}」，為每一組寫一段簡短、專業且具備激勵性的描述（繁體中文）。
    
    請以 JSON 格式回傳，結構為：[{"name": "第一組", "description": "..."}, ...]
  `;

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
            name: { type: Type.STRING, description: "小組序號名稱，例如：第一組" },
            description: { type: Type.STRING, description: "針對該組的勵志描述" }
          },
          required: ["name", "description"]
        }
      }
    }
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    return Array.from({ length: count }, (_, i) => ({
      name: `${getChineseNumber(i + 1)}組`,
      description: "充滿活力與專業精神的團隊"
    }));
  }

  try {
    const parsed = JSON.parse(responseText);
    return parsed as CreativeGroupName[];
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return Array.from({ length: count }, (_, i) => ({
      name: `${getChineseNumber(i + 1)}組`,
      description: "充滿活力與專業精神的團隊"
    }));
  }
};

// 輔助函數：將數字轉換為中文序號
function getChineseNumber(n: number): string {
  const chineseNums = ['零', '第一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九', '第十'];
  if (n <= 10) return chineseNums[n];
  return `第 ${n} `;
}
