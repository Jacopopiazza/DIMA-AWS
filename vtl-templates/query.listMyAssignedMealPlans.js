// packages/backend/vtl-templates/query.listMyAssignedMealPlans.js

export function request(ctx) {
  const nutritionistId = ctx.identity.sub;

  return {
    operation: 'Query',
    index: 'GSI_AssignedNutritionistId',
    query: {
      expression: 'assignedNutritionistId = :nid',
      expressionValues: {
        ':nid': { S: nutritionistId },
      },
    },
  };
}

export function response(ctx) {
  const items = ctx.result && ctx.result.items ? ctx.result.items : [];
  const nextToken =
    ctx.result && ctx.result.nextToken ? ctx.result.nextToken : null;

  // Map only the fields defined in the MealPlan GraphQL type
  const mappedItems = items.map((plan) => {
    let userId = plan.userId;
    if (!userId && plan.PK && plan.PK.startsWith('USER#')) {
      userId = plan.PK.replace('USER#', '');
    }
    return {
      id: plan.mealPlanId, // Set id to mealPlanId for codegen compatibility
      mealPlanId: plan.mealPlanId,
      userId,
      planName: plan.planName,
      startDate: plan.startDate,
      endDate: plan.endDate,
      generatedAt: plan.generatedAt,
      status: plan.status,
      validationStatus: plan.validationStatus,
      assignedNutritionistId: plan.assignedNutritionistId,
      chatId: plan.chatId,
      dailyPlan: plan.dailyPlan,
    };
  });

  // Filter to only include meal plans that need validation (PENDING_REVIEW status)
  const pendingPlans = mappedItems.filter(
    (plan) => plan.validationStatus === 'PENDING_REVIEW',
  );

  return {
    items: pendingPlans,
    nextToken,
    activeMealPlan: null,
  };
}
