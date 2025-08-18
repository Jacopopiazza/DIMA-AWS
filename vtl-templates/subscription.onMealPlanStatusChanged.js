import { util } from "@aws-appsync/utils";

/**
 * Subscription resolver per onMealPlanStatusChanged
 */
export function request(ctx) {
  if (!ctx.identity || !ctx.identity.sub) {
    util.unauthorized();
  }

  const authenticatedUserId = ctx.identity.sub;
  console.log(
    `Setting up subscription filter for user: ${authenticatedUserId}`,
  );

  // Per le subscription basta restituire un oggetto vuoto come payload
  return { payload: {} };
}

/**
 * Response con filtraggio per utente
 */
export function response(ctx) {
  const notification = ctx.result;

  if (!notification) {
    return null;
  }

  const authenticatedUserId = ctx.identity.sub;

  if (notification.userId !== authenticatedUserId) {
    console.log(
      `Filtering out notification for user ${notification.userId} (authenticated as ${authenticatedUserId})`,
    );
    return null;
  }

  console.log(`Delivering notification to user ${authenticatedUserId}`, {
    mealPlanId: notification.mealPlanId,
    status: notification.status,
  });

  return notification;
}
