import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { validationStatus, mealPlanId } = ctx.args.input;
  const pk = ctx.stash.pk;
  const sk = ctx.stash.sk;

  if (!pk || !sk) {
    util.error("Meal plan keys not found in stash");
  }
  if (!validationStatus) {
    util.error("validationStatus is required");
  }
  if (!["VALIDATED", "NOT_VALIDATED"].includes(validationStatus)) {
    util.error("validationStatus must be VALIDATED or NOT_VALIDATED");
  }

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ PK: pk, SK: sk }),
    update: {
      expression:
        "SET validationStatus = :validationStatus, updatedAt = :updatedAt",
      expressionValues: util.dynamodb.toMapValues({
        ":validationStatus": validationStatus,
        ":updatedAt": util.time.nowISO8601(),
      }),
    },
    condition: {
      expression: "attribute_exists(PK) AND attribute_exists(SK)",
    },
  };
}

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
    message: "Meal plan validation status updated successfully.",
    mealPlanId: ctx.args.input.mealPlanId,
  };
}
