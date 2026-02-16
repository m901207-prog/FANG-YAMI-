
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
    You are an expert HR event planner. 
    Task: Generate ${count} unique, professional, and creative team names for a corporate event.
    Event Context: ${context || "A general team-building day"}
    Requirements:
    - Names should be in Traditional Chinese (繁體中文).
    - Each name should have a short, inspiring description.
    - Match the style to the provided context.
  `;

  // Using gemini-3-flash-preview for basic text task as per guidelines
  // Added explicit type for the response for better type safety
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
            name: { type: Type.STRING, description: "The creative team name in Traditional Chinese" },
            description: { type: Type.STRING, description: "A one-sentence description of why this name was chosen" }
          },
          required: ["name", "description"]
        }
      }
    }
  });

  // Accessing response.text as a property (getter) and handling potential undefined
  const responseText = response.text?.trim();
  if (!responseText) {
    return Array.from({ length: count }, (_, i) => ({
      name: `精英第 ${i + 1} 組`,
      description: "充滿活力與專業精神的團隊"
    }));
  }

  try {
    const parsed = JSON.parse(responseText);
    if (!Array.isArray(parsed)) return [];
    
    // Explicitly mapping to ensure the structure matches CreativeGroupName exactly
    return parsed.map((item: any) => ({
      name: String(item?.name || ""),
      description: String(item?.description || "")
    })) as CreativeGroupName[];
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return Array.from({ length: count }, (_, i) => ({
      name: `精英第 ${i + 1} 組`,
      description: "充滿活力與專業精神的團隊"
    }));
  }
};
