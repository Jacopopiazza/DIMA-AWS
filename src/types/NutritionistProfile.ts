export interface NutritionistProfile {
  /** Unique identifier for the nutritionist, e.g. 'N456' */
  nutritionistId: string;

  /** Nutritionist’s display name */
  name: string;

  /** Profile picture URL */
  profilePictureUrl?: string;

  /** Description - Bio */
  description?: string;

  /** Credentials: e.g. "Certified Dietitian, M.S. in Nutrition" */
  credentials: string;

  /** Specialties the nutritionist focuses on, e.g. ["Sports Nutrition", "Vegan Diets"]. */
  specialties: string[];
}
