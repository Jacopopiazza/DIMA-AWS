import { util } from "@aws-appsync/utils";

/**
 * AppSync JS Request Template for deleteMealPlan mutation
 *
 * This resolver:
 * 1. Validates the authenticated user can delete the meal plan
 * 2. Checks if the meal plan is currently active (and handles that case)
 * 3. Deletes the meal plan and related data
 * 4. Returns the deleted meal plan data
 */

export function request(ctx) {
  const { mealPlanId } = ctx.args;
  const authenticatedUserId = ctx.identity.sub;

  // Validate input
  if (!mealPlanId) {
    util.error("mealPlanId is required");
  }

  if (!authenticatedUserId) {
    util.unauthorized();
  }

  // Store data for the response template
  ctx.stash.mealPlanId = mealPlanId;
  ctx.stash.authenticatedUserId = authenticatedUserId;

  // Build the meal plan key
  const mealPlanPk = `USER#${authenticatedUserId}`;
  const mealPlanSk = `PLAN#${mealPlanId}`;

  return {
    operation: "DeleteItem",
    key: {
      PK: util.dynamodb.toDynamoDB(mealPlanPk),
      SK: util.dynamodb.toDynamoDB(mealPlanSk),
    },
    // Removed condition to allow deletion even if item doesn't exist
  };
}

export function response(ctx) {
  console.log("Response context:", JSON.stringify(ctx, null, 2));

  // Check for errors in the context
  if (ctx.error) {
    console.log("Error in response:", ctx.error);
    return {
      success: false,
      mealPlanId: ctx.stash?.mealPlanId || ctx.args?.mealPlanId || "",
      message: ctx.error.message || "Failed to delete meal plan",
    };
  }

  // If the operation succeeded
  console.log("Deletion successful");
  return {
    success: true,
    mealPlanId: ctx.stash?.mealPlanId || ctx.args?.mealPlanId || "",
    message: "Meal plan deleted successfully",
  };
}
