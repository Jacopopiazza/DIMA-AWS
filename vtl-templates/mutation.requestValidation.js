import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const { mealPlanId, nutritionistId } = ctx.args.input;

  if (!ctx.identity || !ctx.identity.sub) {
    util.unauthorized();
  }

  // Validate input
  if (!mealPlanId) {
    util.error('mealPlanId is required');
  }

  if (!nutritionistId) {
    util.error('nutritionistId is required');
  }

  const userId = ctx.identity.sub;

  const pk = `USER#${userId}`;
  const sk = `PLAN#${mealPlanId}`;
  const now = util.time.nowISO8601();

  // Perform the update directly

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({ PK: pk, SK: sk }),
    update: {
      expression:
        'SET assignedNutritionistId = :nutritionistId, validationStatus = :validationStatus, updatedAt = :updatedAt, GSI4PK = :gsi4pk, GSI4SK = :gsi4sk',
      expressionValues: util.dynamodb.toMapValues({
        ':nutritionistId': nutritionistId,
        ':validationStatus': 'PENDING_REVIEW',
        ':updatedAt': now,
        ':gsi4pk': `NUTR#${nutritionistId}`,
        ':gsi4sk': `PLAN#${mealPlanId}`,
      }),
    },
    condition: {
      expression: 'attribute_exists(PK) AND attribute_exists(SK)',
    },
  };
}

export function response(ctx) {
  // Check if the update was successful
  if (ctx.error) {
    return {
      success: false,
      message: ctx.error.message,
      mealPlanId: null,
    };
  }

  // Return MealPlanResponse format
  return {
    success: true,
    message: 'Validation request sent successfully',
    mealPlanId: ctx.args.input.mealPlanId,
  };
}
