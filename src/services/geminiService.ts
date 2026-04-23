import { UserProfile, AnalysisResult } from "../types";

export async function analyzeIngredients(
  imageBase64: string,
  profile: UserProfile
): Promise<AnalysisResult> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64,
        profile,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error("Failed to analyze image");
    }

    const data = await response.json();

    // Gemini response comes nested → extract properly
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw new Error("Analysis failed. Please try again.");
  }
}
