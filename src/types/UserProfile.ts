import { AllergenEnum } from "./AllergenEnum";
import { ExerciseFrequency } from "./ExerciseFrequency";

// backend/src/types/UserProfile.ts
export interface UserProfile {
  userId: string;
  preferences: {
    sex?: "male" | "female" | "other";
    age?: number;
    weightKg?: number; // Match GraphQL
    heightCm?: number; // Match GraphQL
    dailyMealsPreference?: number; // Match GraphQL
    allergies?: AllergenEnum[]; // Consider using the AllergenEnum if applicable in Lambda too
    dietaryRestrictions?: string[]; // Match GraphQL
    exerciseFrequency?: ExerciseFrequency; // Or ExerciseFrequency enum
    openTextPreferences?: string; // Match GraphQL
    targetCalories?: number; // Match GraphQL
  };
}
