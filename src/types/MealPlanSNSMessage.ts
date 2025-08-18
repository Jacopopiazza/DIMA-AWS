// Interface for SNS messages
export interface MealPlanSNSMessage {
  type: "MEAL_PLAN_GENERATED" | "MEAL_PLAN_FAILED";
  userId: string;
  mealPlanId: string;
  timestamp: string;
  details?: {
    planName?: string;
    error?: string;
  };
}
