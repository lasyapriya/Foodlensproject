import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  try {
    const { imageBase64, profile } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY, // ⚠️ NO VITE here
    });

    const prompt = `
Analyze this food ingredient label image.

User Profile:
Allergies: ${profile?.allergies?.join(", ") || "None"}
Health Conditions: ${profile?.healthConditions?.join(", ") || "None"}
Dietary Preferences: ${profile?.dietaryPreferences?.join(", ") || "None"}

Identify problematic ingredients and explain.
Return JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(",")[1],
              },
            },
          ],
        },
      ],
    });

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
