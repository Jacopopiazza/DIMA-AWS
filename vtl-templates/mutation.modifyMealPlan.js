import { util } from "@aws-appsync/utils";

/**
 * Modifies a meal plan name in DynamoDB with proper user authentication.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {import('@aws-appsync/utils').DynamoDBUpdateItemRequest} the request
 */
export function request(ctx) {
  if (!ctx.identity || !ctx.identity.sub) {
    util.unauthorized();
  }

  const userId = ctx.identity.sub;
  const { mealPlanId, mealPlanName } = ctx.args;

  // Validate input
  if (!mealPlanId) {
    util.error("mealPlanId is required");
  }

  if (!mealPlanName) {
    util.error("mealPlanName is required");
  }

  const pk = `USER#${userId}`;
  const sk = `PLAN#${mealPlanId}`;
  const now = util.time.nowISO8601();

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ PK: pk, SK: sk }),
    update: {
      expression: "SET planName = :planName, updatedAt = :updatedAt",
      expressionValues: util.dynamodb.toMapValues({
        ":planName": mealPlanName,
        ":updatedAt": now,
      }),
    },
    condition: {
      expression: "attribute_exists(PK) AND attribute_exists(SK)",
    },
  };
}

/**
 * Returns the modified meal plan or throws an error if the operation failed
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the modified meal plan with success status
 */
export function response(ctx) {
  if (ctx.error) {
    return {
      success: false,
      message: ctx.error.message,
      mealPlanId: null,
    };
  }

  return {
    success: true,
    message: "Meal plan name modified successfully.",
    mealPlanId: ctx.args.mealPlanId,
  };
}
