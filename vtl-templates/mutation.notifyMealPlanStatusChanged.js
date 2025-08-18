import { util } from "@aws-appsync/utils";

/**
 * Resolver per la mutation notifyMealPlanStatusChanged
 * Questa mutation è chiamata solo dalle lambda interne per triggerare le subscriptions
 */
export function request(ctx) {
  // Valida l'input
  const { input } = ctx.args;

  if (
    !input ||
    !input.userId ||
    !input.mealPlanId ||
    !input.status ||
    !input.timestamp
  ) {
    util.error(
      "Missing required fields in notification input",
      "ValidationException",
    );
  }

  // Valida che lo status sia uno dei valori attesi
  const validStatuses = ["PENDING", "IN_PROGRESS", "GENERATED", "FAILED"];
  if (!validStatuses.includes(input.status)) {
    util.error(
      `Invalid status: ${input.status}. Must be one of: ${validStatuses.join(", ")}`,
      "ValidationException",
    );
  }

  console.log("Processing meal plan notification:", {
    userId: input.userId,
    mealPlanId: input.mealPlanId,
    status: input.status,
    timestamp: input.timestamp,
  });

  // Non esegue nessuna operazione su database - è solo per triggerare la subscription
  // Usa il data source "None" - non ha bisogno di operazioni DB
  return {};
}

/**
 * Response function - ritorna i dati della notifica per la subscription
 */
export function response(ctx) {
  // Se ci sono errori nel request, propagali
  if (ctx.error) {
    console.error("Error in notifyMealPlanStatusChanged request:", ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  const { input } = ctx.args;

  // Costruisce la risposta MealPlanNotification
  const notification = {
    userId: input.userId,
    mealPlanId: input.mealPlanId,
    status: input.status,
    timestamp: input.timestamp,
    error: input.error || null,
  };

  console.log("Returning meal plan notification:", notification);

  return notification;
}
