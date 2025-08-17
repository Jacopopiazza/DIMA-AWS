// AppSync JS pipeline function for createMealPlan (simplified: last created meal is active)
import { util } from "@aws-appsync/utils";

/**
 * Creates a meal plan in DynamoDB with proper user authentication and data formatting.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {import('@aws-appsync/utils').DynamoDBPutItemRequest} the request
 */
export function request(ctx) {
  if (!ctx.identity || !ctx.identity.sub) {
    util.unauthorized();
  }

  const userId = ctx.identity.sub;
  const planId = util.autoId();
  const pk = `USER#${userId}`;
  const sk = `PLAN#${planId}`;
  const now = util.time.nowISO8601();
  const input = ctx.args.input;

  // Ensure all days are present as arrays (even if empty)
  const weekDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const dailyPlan = {};
  for (const day of weekDays) {
    const meals =
      input.dailyPlan && input.dailyPlan[day] ? input.dailyPlan[day] : [];
    dailyPlan[day] = meals;
  }

  // Prepare the item data
  const itemData = {
    planName: input.planName,
    startDate: input.startDate,
    endDate: input.endDate,
    dailyPlan: dailyPlan,
    mealPlanId: planId,
    PK: pk,
    SK: sk,
    entityType: "MEAL_PLAN",
    createdAt: now,
    updatedAt: now,
    status: "GENERATED",
  };

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({ PK: pk, SK: sk }),
    attributeValues: util.dynamodb.toMapValues(itemData),
    condition: {
      expression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
    },
  };
}

/**
 * Returns the created meal plan or throws an error if the operation failed
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the created meal plan with success status
 */
export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  return {
    success: true,
    message: "Meal plan created successfully.",
    mealPlanId: ctx.result.mealPlanId,
  };
}
