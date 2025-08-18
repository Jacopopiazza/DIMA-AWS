export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  AWSDate: { input: string; output: string };
  AWSDateTime: { input: string; output: string };
  AWSEmail: { input: string; output: string };
  AWSJSON: { input: { [key: string]: any }; output: { [key: string]: any } };
  AWSURL: { input: string; output: string };
};

/** Represents common food allergens based on EU FIC (Regulation (EU) No 1169/2011) and potentially others. */
export enum AllergenEnum {
  /** Celery and products thereof. */
  CELERY = "CELERY",
  /** Crustaceans and products thereof. */
  CRUSTACEANS = "CRUSTACEANS",
  /** Eggs and products thereof. */
  EGGS = "EGGS",
  /** Fish and products thereof. */
  FISH = "FISH",
  /** Cereals containing gluten, namely: wheat (such as spelt and khorasan wheat), rye, barley, oats or their hybridised strains, and products thereof. */
  GLUTEN_CEREALS = "GLUTEN_CEREALS",
  /** Lupin and products thereof. */
  LUPIN = "LUPIN",
  /** Milk and products thereof (including lactose). */
  MILK = "MILK",
  /** Molluscs and products thereof. */
  MOLLUSCS = "MOLLUSCS",
  /** Mustard and products thereof. */
  MUSTARD = "MUSTARD",
  /** Nuts, namely: almonds, hazelnuts, walnuts, cashews, pecan nuts, Brazil nuts, pistachio nuts, macadamia or Queensland nuts, and products thereof. */
  NUTS = "NUTS",
  /** Peanuts and products thereof. */
  PEANUTS = "PEANUTS",
  /** Sesame seeds and products thereof. */
  SESAME_SEEDS = "SESAME_SEEDS",
  /** Soybeans and products thereof. */
  SOYBEANS = "SOYBEANS",
  /** Sulphur dioxide and sulphites at concentrations of more than 10 mg/kg or 10 mg/litre in terms of the total SO2. */
  SULPHITES = "SULPHITES",
}

/** Input for assigning a nutritionist to a specific meal plan. */
export type AssignNutritionistInput = {
  mealPlanId: Scalars["ID"]["input"];
  nutritionistId: Scalars["ID"]["input"];
};

/** Represents a single message within a chat session. */
export type ChatMessage = {
  __typename?: "ChatMessage";
  chatId: Scalars["ID"]["output"];
  messageContent: Scalars["String"]["output"];
  messageId: Scalars["ID"]["output"];
  senderId: Scalars["ID"]["output"];
  senderType: SenderType;
  sentAt: Scalars["AWSDateTime"]["output"];
};

/** Connection type for paginated ChatMessage results. */
export type ChatMessageConnection = {
  __typename?: "ChatMessageConnection";
  items: Array<ChatMessage>;
  nextToken?: Maybe<Scalars["String"]["output"]>;
};

/** Metadata for a chat session between a user and a nutritionist regarding a meal plan. */
export type ChatMetadata = {
  __typename?: "ChatMetadata";
  chatId: Scalars["ID"]["output"];
  createdAt?: Maybe<Scalars["AWSDateTime"]["output"]>;
  lastMessageSnippet?: Maybe<Scalars["String"]["output"]>;
  lastMessageTimestamp?: Maybe<Scalars["AWSDateTime"]["output"]>;
  mealPlanId: Scalars["ID"]["output"];
  nutritionistGivenName?: Maybe<Scalars["String"]["output"]>;
  nutritionistId: Scalars["ID"]["output"];
  nutritionistUnreadCount?: Maybe<Scalars["Int"]["output"]>;
  planName?: Maybe<Scalars["String"]["output"]>;
  userGivenName?: Maybe<Scalars["String"]["output"]>;
  userId: Scalars["ID"]["output"];
  userUnreadCount?: Maybe<Scalars["Int"]["output"]>;
};

export type ChatMetadataConnection = {
  __typename?: "ChatMetadataConnection";
  items: Array<ChatMetadata>;
  nextToken?: Maybe<Scalars["String"]["output"]>;
};

/** Input for creating a new meal plan directly. */
export type CreateMealPlanInput = {
  dailyPlan: DailyPlanDataInput;
  endDate: Scalars["AWSDate"]["input"];
  planName: Scalars["String"]["input"];
  startDate: Scalars["AWSDate"]["input"];
  status?: InputMaybe<PlanStatus>;
};

/** Represents the Map<Weekday, List<MealObject>> structure for daily meals. */
export type DailyPlanData = {
  __typename?: "DailyPlanData";
  friday?: Maybe<Array<Meal>>;
  monday?: Maybe<Array<Meal>>;
  saturday?: Maybe<Array<Meal>>;
  sunday?: Maybe<Array<Meal>>;
  thursday?: Maybe<Array<Meal>>;
  tuesday?: Maybe<Array<Meal>>;
  wednesday?: Maybe<Array<Meal>>;
};

/** Input for the map of daily meals. */
export type DailyPlanDataInput = {
  friday?: InputMaybe<Array<MealInput>>;
  monday?: InputMaybe<Array<MealInput>>;
  saturday?: InputMaybe<Array<MealInput>>;
  sunday?: InputMaybe<Array<MealInput>>;
  thursday?: InputMaybe<Array<MealInput>>;
  tuesday?: InputMaybe<Array<MealInput>>;
  wednesday?: InputMaybe<Array<MealInput>>;
};

export enum ExerciseFrequency {
  EVERY_DAY = "EVERY_DAY",
  FIVE_TIMES_A_WEEK = "FIVE_TIMES_A_WEEK",
  FOUR_TIMES_A_WEEK = "FOUR_TIMES_A_WEEK",
  NONE = "NONE",
  NOT_SPECIFIED = "NOT_SPECIFIED",
  ONCE_A_WEEK = "ONCE_A_WEEK",
  SIX_TIMES_A_WEEK = "SIX_TIMES_A_WEEK",
  THREE_TIMES_A_WEEK = "THREE_TIMES_A_WEEK",
  TWICE_A_WEEK = "TWICE_A_WEEK",
}

/** Represents a single ingredient within a meal. */
export type Ingredient = {
  __typename?: "Ingredient";
  amount: Scalars["Float"]["output"];
  macros: Macros;
  name: Scalars["String"]["output"];
  unit?: Maybe<Scalars["String"]["output"]>;
};

/** Input for a single ingredient within a meal. */
export type IngredientInput = {
  amount: Scalars["Float"]["input"];
  macros: MacrosInput;
  name: Scalars["String"]["input"];
  unit?: InputMaybe<Scalars["String"]["input"]>;
};

export type ListNutritionistsFilter = {
  isAvailable?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** Represents macronutrient breakdown. */
export type Macros = {
  __typename?: "Macros";
  calories: Scalars["Float"]["output"];
  carbohydrates: Scalars["Float"]["output"];
  fats: Scalars["Float"]["output"];
  proteins: Scalars["Float"]["output"];
};

/** Input for macronutrient breakdown. */
export type MacrosInput = {
  calories: Scalars["Float"]["input"];
  carbohydrates: Scalars["Float"]["input"];
  fats: Scalars["Float"]["input"];
  proteins: Scalars["Float"]["input"];
};

/** Input for marking a meal as completed for the current day. */
export type MarkMealCompletedInput = {
  date?: InputMaybe<Scalars["AWSDate"]["input"]>;
  mealName: MealNameEnum;
  mealPlanId: Scalars["ID"]["input"];
};

/** Represents a single meal within a day's plan. */
export type Meal = {
  __typename?: "Meal";
  ingredients: Array<Ingredient>;
  name: MealNameEnum;
  recipe?: Maybe<Scalars["String"]["output"]>;
  recipeName?: Maybe<Scalars["String"]["output"]>;
  totalMacros: Macros;
};

/** Input for a single meal within a day's plan. */
export type MealInput = {
  ingredients: Array<IngredientInput>;
  name: MealNameEnum;
  recipe?: InputMaybe<Scalars["String"]["input"]>;
  recipeName?: InputMaybe<Scalars["String"]["input"]>;
  totalMacros: MacrosInput;
};

export enum MealNameEnum {
  BREAKFAST = "BREAKFAST",
  DINNER = "DINNER",
  LUNCH = "LUNCH",
  SNACK_AFTERNOON = "SNACK_AFTERNOON",
  SNACK_EVENING = "SNACK_EVENING",
  SNACK_MORNING = "SNACK_MORNING",
}

export type MealPlan = {
  __typename?: "MealPlan";
  assignedNutritionistId?: Maybe<Scalars["ID"]["output"]>;
  chatId?: Maybe<Scalars["ID"]["output"]>;
  dailyPlan?: Maybe<DailyPlanData>;
  generatedAt?: Maybe<Scalars["AWSDateTime"]["output"]>;
  mealPlanId: Scalars["ID"]["output"];
  planName?: Maybe<Scalars["String"]["output"]>;
  status?: Maybe<PlanStatus>;
  userId: Scalars["ID"]["output"];
  validationStatus?: Maybe<MealPlanValidationStatus>;
};

export type MealPlanConnection = {
  __typename?: "MealPlanConnection";
  activeMealPlan?: Maybe<MealPlan>;
  items: Array<MealPlan>;
  nextToken?: Maybe<Scalars["String"]["output"]>;
};

/** Status result for the asynchronous meal plan generation mutation. */
export type MealPlanGenerationStatus = {
  __typename?: "MealPlanGenerationStatus";
  mealPlanId?: Maybe<Scalars["ID"]["output"]>;
  message?: Maybe<Scalars["String"]["output"]>;
  status: MealPlanGenerationStatusValue;
};

export enum MealPlanGenerationStatusValue {
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING = "PENDING",
}

/** Represents a list of meal plans for the authenticated user. */
export type MealPlanList = {
  __typename?: "MealPlanList";
  activeMealPlan?: Maybe<Scalars["ID"]["output"]>;
  items: Array<MealPlan>;
  nextToken?: Maybe<Scalars["String"]["output"]>;
};

/** Represents the notification for a meal plan update. */
export type MealPlanNotification = {
  __typename?: "MealPlanNotification";
  error?: Maybe<Scalars["String"]["output"]>;
  mealPlanId: Scalars["ID"]["output"];
  status: Scalars["String"]["output"];
  timestamp: Scalars["AWSDateTime"]["output"];
  userId: Scalars["ID"]["output"];
};

/** Represents the input for a notification for a meal plan update. */
export type MealPlanNotificationInput = {
  error?: InputMaybe<Scalars["String"]["input"]>;
  mealPlanId: Scalars["ID"]["input"];
  status: Scalars["String"]["input"];
  timestamp: Scalars["AWSDateTime"]["input"];
  userId: Scalars["ID"]["input"];
};

/** The response after creating a meal plan. */
export type MealPlanResponse = {
  __typename?: "MealPlanResponse";
  mealPlanId?: Maybe<Scalars["ID"]["output"]>;
  message?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
};

export enum MealPlanValidationStatus {
  NOT_VALIDATED = "NOT_VALIDATED",
  PENDING_REVIEW = "PENDING_REVIEW",
  VALIDATED = "VALIDATED",
}

/** Represents a Meal along with its completion status for the day */
export type MealWithStatus = {
  __typename?: "MealWithStatus";
  isCompleted: Scalars["Boolean"]["output"];
  meal: Meal;
};

export type Mutation = {
  __typename?: "Mutation";
  /** Assigns a nutritionist to a meal plan, initiating the chat capability. (Pro feature) */
  assignNutritionistToPlan?: Maybe<MealPlan>;
  /**
   * Directly creates a new meal plan.
   * Typically used by nutritionists or for admin purposes.
   */
  createMealPlan?: Maybe<MealPlanResponse>;
  /** Deletes a meal plan. */
  deleteMealPlan?: Maybe<MealPlanResponse>;
  /** Gets a meal plan by its ID. */
  getMealPlanById?: Maybe<MealPlan>;
  /** Marks a meal as completed for today for the authenticated user. */
  markMealAsCompleted?: Maybe<PlanDayCompletion>;
  /** Modifies a meal plan. */
  modifyMealPlan?: Maybe<MealPlanResponse>;
  /** Mutations solo per le notifiche (chiamate dalla notification lambda) */
  notifyMealPlanStatusChanged?: Maybe<MealPlanNotification>;
  /** Initiates the generation of a new meal plan, potentially overriding default preferences. Can be async. */
  requestNewMealPlan?: Maybe<MealPlanGenerationStatus>;
  /** Requests validation of a meal plan by a nutritionist. */
  requestValidation?: Maybe<MealPlanResponse>;
  /** Sends a message within a specific chat session. Resolver must check participation. */
  sendChatMessage?: Maybe<ChatMessage>;
  /** Sets a specific meal plan as the active one for the user. */
  setActiveMealPlan?: Maybe<MealPlanResponse>;
  /**
   * Sets the complete list of completed meals for a specific plan on a specific date.
   * Useful for bulk updates or syncing from an offline-first client.
   */
  setPlanDayCompletion?: Maybe<PlanDayCompletion>;
  /** Unmarks a meal as completed for today for the authenticated user. */
  unmarkMealAsCompleted?: Maybe<PlanDayCompletion>;
  /** Creates or updates the nutritionist profile for the authenticated nutritionist. */
  updateMyNutritionistProfile?: Maybe<NutritionistProfile>;
  /** Updates details/preferences for the authenticated user. Replaces putUserPreferences. */
  updateUserDetails?: Maybe<UserDetails>;
  /** Validates a meal plan. */
  validateMealPlan?: Maybe<MealPlanResponse>;
};

export type MutationAssignNutritionistToPlanArgs = {
  input: AssignNutritionistInput;
};

export type MutationCreateMealPlanArgs = {
  input: CreateMealPlanInput;
};

export type MutationDeleteMealPlanArgs = {
  mealPlanId: Scalars["ID"]["input"];
};

export type MutationGetMealPlanByIdArgs = {
  mealPlanId: Scalars["ID"]["input"];
};

export type MutationMarkMealAsCompletedArgs = {
  input: MarkMealCompletedInput;
};

export type MutationModifyMealPlanArgs = {
  mealPlanId: Scalars["ID"]["input"];
  mealPlanName?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationNotifyMealPlanStatusChangedArgs = {
  input: MealPlanNotificationInput;
};

export type MutationRequestNewMealPlanArgs = {
  prefsOverride?: InputMaybe<PlanRequestPreferencesInput>;
};

export type MutationRequestValidationArgs = {
  input: RequestValidationInput;
};

export type MutationSendChatMessageArgs = {
  input: SendMessageInput;
};

export type MutationSetActiveMealPlanArgs = {
  mealPlanId: Scalars["ID"]["input"];
};

export type MutationSetPlanDayCompletionArgs = {
  input: SetPlanDayCompletionInput;
};

export type MutationUnmarkMealAsCompletedArgs = {
  input: UnmarkMealCompletedInput;
};

export type MutationUpdateMyNutritionistProfileArgs = {
  input: UpdateNutritionistProfileInput;
};

export type MutationUpdateUserDetailsArgs = {
  input: UpdateUserDetailsInput;
};

export type MutationValidateMealPlanArgs = {
  input: ValidateMealPlanInput;
};

/** Represents public-facing details of a nutritionist. */
export type NutritionistProfile = {
  __typename?: "NutritionistProfile";
  bio?: Maybe<Scalars["String"]["output"]>;
  familyName?: Maybe<Scalars["String"]["output"]>;
  givenName?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isAvailable?: Maybe<Scalars["Boolean"]["output"]>;
  nutritionistId: Scalars["ID"]["output"];
  profilePictureUrl?: Maybe<Scalars["String"]["output"]>;
  specialization?: Maybe<Scalars["String"]["output"]>;
};

export type NutritionistProfileConnection = {
  __typename?: "NutritionistProfileConnection";
  items: Array<NutritionistProfile>;
  nextToken?: Maybe<Scalars["String"]["output"]>;
};

/** Represents the completion status of meals for a specific plan on a specific date. */
export type PlanDayCompletion = {
  __typename?: "PlanDayCompletion";
  completedMealNames: Array<MealNameEnum>;
  date: Scalars["AWSDate"]["output"];
  planId: Scalars["ID"]["output"];
  updatedAt: Scalars["AWSDateTime"]["output"];
  userId: Scalars["ID"]["output"];
};

/** Input for specifying preferences when requesting a new meal plan. */
export type PlanRequestPreferencesInput = {
  allergies?: InputMaybe<Array<AllergenEnum>>;
  dailyMealsPreference?: InputMaybe<Scalars["Int"]["input"]>;
  dateOfBirth?: InputMaybe<Scalars["AWSDate"]["input"]>;
  dietaryRestrictions?: InputMaybe<Scalars["String"]["input"]>;
  exerciseFrequency?: InputMaybe<ExerciseFrequency>;
  heightCm?: InputMaybe<Scalars["Float"]["input"]>;
  openTextPreferences?: InputMaybe<Scalars["String"]["input"]>;
  weightKg?: InputMaybe<Scalars["Float"]["input"]>;
};

export enum PlanStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  FAILED = "FAILED",
  GENERATED = "GENERATED",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING = "PENDING",
}

export type Query = {
  __typename?: "Query";
  /** Get the meal plan currently active for the user. */
  getActiveMealPlan?: Maybe<MealPlan>;
  /** Gets messages for a specific chat session. Requires pagination. Resolver must check participation. */
  getChatMessages?: Maybe<ChatMessageConnection>;
  /** Gets a specific MealPlan by its ID. Resolver must verify ownership. */
  getMealPlanById?: Maybe<MealPlan>;
  /** Fetches the NutritionistProfile for the authenticated nutritionist. */
  getMyNutritionistProfile?: Maybe<NutritionistProfile>;
  /** Fetches the meal completion status for a specific plan on a specific date for the authenticated user. */
  getPlanDayCompletion?: Maybe<PlanDayCompletion>;
  /** Fetches data needed for the 'Today' page: active plan's details for today and completion status. */
  getTodaysPlanAndStatus?: Maybe<TodaysPlan>;
  /** Fetches the UserDetails (preferences, etc.) for the authenticated user. */
  getUserDetails?: Maybe<UserDetails>;
  /** Lists chat sessions assigned to the authenticated nutritionist. Supports pagination. */
  listMyAssignedChats?: Maybe<ChatMetadataConnection>;
  /** Lists meal plans assigned to the authenticated nutritionist. Only meal plans with PENDING_REVIEW status are returned. Supports pagination. */
  listMyAssignedMealPlans?: Maybe<MealPlanList>;
  /** Lists chat sessions for the authenticated user. Supports pagination. (Pro feature) */
  listMyChats?: Maybe<ChatMetadataConnection>;
  /** Lists MealPlans for the authenticated user. Supports pagination. */
  listMyMealPlans?: Maybe<MealPlanList>;
  /** Lists available nutritionists, potentially filterable. Supports pagination. (Pro feature?) */
  listNutritionists?: Maybe<NutritionistProfileConnection>;
};

export type QueryGetChatMessagesArgs = {
  chatId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  nextToken?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryGetMealPlanByIdArgs = {
  mealPlanId: Scalars["ID"]["input"];
};

export type QueryGetPlanDayCompletionArgs = {
  date: Scalars["AWSDate"]["input"];
  planId: Scalars["ID"]["input"];
};

export type QueryListMyAssignedChatsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  nextToken?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryListMyAssignedMealPlansArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  nextToken?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryListMyChatsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  nextToken?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryListMyMealPlansArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  nextToken?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryListNutritionistsArgs = {
  filter?: InputMaybe<ListNutritionistsFilter>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  nextToken?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for requesting validation of a meal plan by a user. */
export type RequestValidationInput = {
  mealPlanId: Scalars["ID"]["input"];
  nutritionistId: Scalars["ID"]["input"];
};

/** Input for sending a chat message. */
export type SendMessageInput = {
  chatId: Scalars["ID"]["input"];
  messageContent: Scalars["String"]["input"];
};

export enum SenderType {
  NUTRITIONIST = "NUTRITIONIST",
  USER = "USER",
}

/** Input for setting the completion status of a meal plan for a specific day. Used to sync offline data. */
export type SetPlanDayCompletionInput = {
  completedMealNames: Array<MealNameEnum>;
  date: Scalars["AWSDate"]["input"];
  planId: Scalars["ID"]["input"];
};

export type Subscription = {
  __typename?: "Subscription";
  /** Subscription notifica */
  onMealPlanStatusChanged?: Maybe<MealPlanNotification>;
};

export type SubscriptionOnMealPlanStatusChangedArgs = {
  userId: Scalars["ID"]["input"];
};

/** Combined type for the Today page query result. */
export type TodaysPlan = {
  __typename?: "TodaysPlan";
  activePlanDetails?: Maybe<MealPlan>;
  mealsForToday?: Maybe<Array<MealWithStatus>>;
  todaysCompletion?: Maybe<PlanDayCompletion>;
};

/** Input for unmarking a meal as completed for the current day. */
export type UnmarkMealCompletedInput = {
  date?: InputMaybe<Scalars["AWSDate"]["input"]>;
  mealName: MealNameEnum;
  mealPlanId: Scalars["ID"]["input"];
};

/** Input for updating nutritionist profile. */
export type UpdateNutritionistProfileInput = {
  bio?: InputMaybe<Scalars["String"]["input"]>;
  familyName?: InputMaybe<Scalars["String"]["input"]>;
  givenName?: InputMaybe<Scalars["String"]["input"]>;
  isAvailable?: InputMaybe<Scalars["Boolean"]["input"]>;
  profilePictureUrl?: InputMaybe<Scalars["String"]["input"]>;
  specialization?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for updating user preferences/details. */
export type UpdateUserDetailsInput = {
  allergies?: InputMaybe<Array<AllergenEnum>>;
  dailyMealsPreference?: InputMaybe<Scalars["Int"]["input"]>;
  dateOfBirth?: InputMaybe<Scalars["AWSDate"]["input"]>;
  dietaryRestrictions?: InputMaybe<Scalars["String"]["input"]>;
  exerciseFrequency?: InputMaybe<ExerciseFrequency>;
  heightCm?: InputMaybe<Scalars["Float"]["input"]>;
  openTextPreferences?: InputMaybe<Scalars["String"]["input"]>;
  weightKg?: InputMaybe<Scalars["Float"]["input"]>;
};

/** Represents user profile details and preferences stored in DynamoDB. */
export type UserDetails = {
  __typename?: "UserDetails";
  activeMealPlanId?: Maybe<Scalars["ID"]["output"]>;
  allergies?: Maybe<Array<AllergenEnum>>;
  createdAt?: Maybe<Scalars["AWSDateTime"]["output"]>;
  dailyMealsPreference?: Maybe<Scalars["Int"]["output"]>;
  dateOfBirth?: Maybe<Scalars["AWSDate"]["output"]>;
  dietaryRestrictions?: Maybe<Scalars["String"]["output"]>;
  exerciseFrequency?: Maybe<ExerciseFrequency>;
  heightCm?: Maybe<Scalars["Float"]["output"]>;
  openTextPreferences?: Maybe<Scalars["String"]["output"]>;
  updatedAt?: Maybe<Scalars["AWSDateTime"]["output"]>;
  userId: Scalars["ID"]["output"];
  weightKg?: Maybe<Scalars["Float"]["output"]>;
};

/** Input for validating a meal plan. */
export type ValidateMealPlanInput = {
  mealPlanId: Scalars["ID"]["input"];
  validationStatus: MealPlanValidationStatus;
};

export enum WeekdayEnum {
  FRIDAY = "FRIDAY",
  MONDAY = "MONDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
  THURSDAY = "THURSDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
}
