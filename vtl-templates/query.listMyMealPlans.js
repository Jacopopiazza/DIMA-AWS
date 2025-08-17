// packages/backend/vtl-templates/query.ListMyMealPlans.js

export function request(ctx) {
  // Query meal plans for the current user from DynamoDB
  return {
    operation: 'Query',
    query: {
      expression: 'PK = :pk',
      expressionValues: {
        ':pk': { S: `USER#${ctx.identity.sub}` },
      },
    },
  };
}

export function response(ctx) {
  const items = ctx.result && ctx.result.items ? ctx.result.items : [];
  const nextToken =
    ctx.result && ctx.result.nextToken ? ctx.result.nextToken : null;

  // Find the active meal plan by status
  const activeMealPlan = items.find((plan) => plan.status === 'ACTIVE');
  const activeMealPlanId = activeMealPlan ? activeMealPlan.mealPlanId : null;

  return {
    items,
    nextToken,
    activeMealPlan: activeMealPlanId,
  };
}
