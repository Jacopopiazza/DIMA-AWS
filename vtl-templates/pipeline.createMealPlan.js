import { util } from '@aws-appsync/utils';

export async function pipeline(ctx) {
  // 1. Authenticate user
  if (!ctx.identity || !ctx.identity.sub) {
    util.unauthorized();
  }

  // 2. List all meal plans for the user
  const listPlansFn = require('./query.listMyMealPlans.js');
  const listResult = listPlansFn.request(ctx);
  ctx.prev = { result: await ctx.callDynamoDB(listResult) };
  const items = ctx.prev.result.items || [];

  // 3. Create the new meal plan
  const createPlanFn = require('./mutation.createMealPlan.js');
  const createResult = createPlanFn.request(ctx);
  ctx.result = await ctx.callDynamoDB(createResult);
  ctx.stash.newMealPlanId = ctx.stash.newMealPlanId || ctx.result.mealPlanId;

  // 4. Deactivate all other meal plans using Lambda
  const lambdaPayload = {
    items,
    newMealPlanId: ctx.stash.newMealPlanId,
    tableName: process.env.TABLE_NAME || ctx.env.TABLE_NAME,
  };
  await ctx.callLambda(
    'DeactivateOtherMealPlansLambdaDataSource',
    lambdaPayload,
  );

  // 5. Return the result of the creation
  return createPlanFn.response(ctx);
}
