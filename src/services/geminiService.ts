import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeIngredients(
  imageBase64: string,
  profile: UserProfile
): Promise<AnalysisResult> {
  const prompt = `
    Analyze this food ingredient label image. 
    Cross-reference the ingredients found with the following user profile:
    Allergies: ${profile.allergies.join(", ") || "None"}
    Health Conditions: ${profile.healthConditions.join(", ") || "None"}
    Dietary Preferences: ${profile.dietaryPreferences.join(", ") || "None"}

    Identify if any ingredients are directly or indirectly problematic for the user.
    For example, if they are allergic to chickpeas, flag "hummus" or "garbanzo beans".
    
    For EVERY detected ingredient (even safe ones), provide:
    1. A brief description of what it is.
    2. A nutritional note specifically considering the user's health conditions (e.g., "High in sodium, which may affect hypertension" or "Low glycemic index, safe for diabetes").

    Return the analysis in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1] || imageBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isSafe: { type: Type.BOOLEAN },
          problematicIngredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["name", "reason"],
            },
          },
          summary: { type: Type.STRING },
          allIngredients: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                nutritionalNote: { type: Type.STRING },
              },
              required: ["name", "description"]
            },
          },
        },
        required: ["isSafe", "problematicIngredients", "summary", "allIngredients"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze image");
  }
}
