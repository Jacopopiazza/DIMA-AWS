import { Schema, Type } from "@google/genai";

// Tipi comuni estratti per riutilizzo
const MacrosSchema = {
  type: Type.OBJECT,
  required: ["proteins", "carbohydrates", "fats", "calories"],
  properties: {
    proteins: { type: Type.NUMBER },
    carbohydrates: { type: Type.NUMBER },
    fats: { type: Type.NUMBER },
    calories: { type: Type.NUMBER },
  },
};

const IngredientSchema = {
  type: Type.OBJECT,
  required: ["name", "amount", "macros", "unit"],
  properties: {
    name: { type: Type.STRING },
    amount: { type: Type.NUMBER },
    macros: MacrosSchema,
    unit: { type: Type.STRING },
  },
};

const MealSchema = {
  type: Type.OBJECT,
  required: ["name", "ingredients", "totalMacros", "recipe", "recipeName"],
  properties: {
    name: {
      type: Type.STRING,
      enum: [
        "BREAKFAST",
        "LUNCH",
        "DINNER",
        "SNACK_MORNING",
        "SNACK_AFTERNOON",
        "SNACK_EVENING",
      ],
    },
    ingredients: {
      type: Type.ARRAY,
      items: IngredientSchema,
    },
    totalMacros: MacrosSchema,
    recipe: { type: Type.STRING },
    recipeName: { type: Type.STRING },
  },
};

const DayMealsSchema = {
  type: Type.ARRAY,
  items: MealSchema,
};

export const MealPlanSchema: Schema = {
  type: Type.OBJECT,
  required: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ],
  properties: {
    monday: DayMealsSchema,
    tuesday: DayMealsSchema,
    wednesday: DayMealsSchema,
    thursday: DayMealsSchema,
    friday: DayMealsSchema,
    saturday: DayMealsSchema,
    sunday: DayMealsSchema,
  },
};
