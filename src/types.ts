export interface UserProfile {
  allergies: string[];
  healthConditions: string[];
  dietaryPreferences: string[];
}

export interface IngredientDetail {
  name: string;
  description: string;
  nutritionalNote?: string;
}

export interface AnalysisResult {
  isSafe: boolean;
  problematicIngredients: {
    name: string;
    reason: string;
  }[];
  summary: string;
  allIngredients: IngredientDetail[];
}
