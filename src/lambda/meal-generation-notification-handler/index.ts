// src/lambda/notification-handler/index.ts

import { SNSEvent, SNSHandler } from "aws-lambda";
import { fromEnv } from "@aws-sdk/credential-providers";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@aws-sdk/protocol-http";
import fetch from "node-fetch";

// Variabili ambiente
const { APPSYNC_API_URL, AWS_REGION } = process.env;

// ==========================================
// INTERFACCE E TIPI
// ==========================================

interface MealPlanSNSMessage {
  type: "MEAL_PLAN_GENERATED" | "MEAL_PLAN_FAILED";
  userId: string;
  mealPlanId: string;
  timestamp: string;
  details?: {
    planName?: string;
    error?: string;
  };
}

interface AppSyncNotificationMutation {
  mutation: string;
  variables: Record<string, any>;
}

interface GraphQLResponse {
  data?: any;
  errors?: Array<{ message: string }>;
}

interface ProcessingResult {
  messageId: string;
  status: "success" | "failed" | "skipped";
  userId?: string;
  type?: string;
  reason?: string;
  error?: string;
}

// ==========================================
// FUNZIONI HELPER
// ==========================================

/**
 * Valida e converte una risposta unknown in GraphQLResponse
 */
function validateGraphQLResponse(data: unknown): GraphQLResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid GraphQL response: not an object");
  }

  const obj = data as Record<string, unknown>;

  // Valida che errors sia un array se presente
  if (obj.errors && !Array.isArray(obj.errors)) {
    throw new Error("Invalid GraphQL response: errors is not an array");
  }

  return obj as GraphQLResponse;
}

/**
 * Triggera una subscription AppSync chiamando una mutation specifica
 * Questa funzione è isolata e gestisce errori specifici delle notifiche
 */
async function triggerAppSyncSubscription(
  userId: string,
  mutation: AppSyncNotificationMutation,
): Promise<void> {
  if (!APPSYNC_API_URL) {
    throw new Error("APPSYNC_API_URL environment variable not configured");
  }

  if (!AWS_REGION) {
    throw new Error("AWS_REGION environment variable not configured");
  }

  try {
    console.log("Triggering AppSync subscription for user:", userId);
    console.log("Using mutation:", JSON.stringify(mutation, null, 2));
    console.log(
      "Using variables:",
      JSON.stringify(mutation.variables, null, 2),
    );

    // Prepara la richiesta HTTP per AppSync
    const url = new URL(APPSYNC_API_URL);
    const requestBody = JSON.stringify({
      query: mutation.mutation,
      variables: mutation.variables,
    });

    const request = new HttpRequest({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Host: url.hostname,
        "Content-Length": Buffer.byteLength(requestBody).toString(),
      },
      hostname: url.hostname,
      path: url.pathname,
      body: requestBody,
    });

    // Firma la richiesta con AWS Signature V4 usando le credenziali della Lambda
    const signer = new SignatureV4({
      credentials: fromEnv(), // Usa automaticamente il ruolo IAM della Lambda
      region: AWS_REGION,
      service: "appsync",
      sha256: Sha256,
    });

    console.log("Signing request with IAM credentials...");
    const signedRequest = await signer.sign(request);

    // Esegui la richiesta HTTP firmata
    console.log("Sending request to AppSync:", APPSYNC_API_URL);
    const response = await fetch(APPSYNC_API_URL, {
      method: signedRequest.method,
      headers: signedRequest.headers,
      body: signedRequest.body,
    });

    // Gestisci la risposta
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AppSync request failed:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });

      // Errori specifici per debugging
      if (response.status === 401) {
        throw new Error(`AppSync authentication failed: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`AppSync authorization failed: ${errorText}`);
      } else if (response.status === 400) {
        throw new Error(`AppSync bad request: ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error(
          `AppSync server error (${response.status}): ${errorText}`,
        );
      } else {
        throw new Error(
          `AppSync request failed (${response.status}): ${errorText}`,
        );
      }
    }

    // Parse e valida la risposta con proper typing
    const responseData = await response.json();
    const result = validateGraphQLResponse(responseData);
    console.log("AppSync response received:", JSON.stringify(result));

    // Controlla se ci sono errori GraphQL nella risposta
    if (
      result.errors &&
      Array.isArray(result.errors) &&
      result.errors.length > 0
    ) {
      const graphqlErrors = result.errors.map((err) => err.message).join(", ");
      throw new Error(`AppSync GraphQL errors: ${graphqlErrors}`);
    }

    // Controlla se la mutation ha restituito dati validi
    if (!result.data) {
      throw new Error("AppSync mutation returned no data");
    }

    console.log(
      "AppSync subscription triggered successfully for user:",
      userId,
    );
  } catch (error) {
    console.error("Failed to trigger AppSync subscription:", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-lancia l'errore per permettere retry/DLQ handling
    throw new Error(
      `AppSync subscription failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ==========================================
// HANDLER PRINCIPALE
// ==========================================

/**
 * Handler principale per processare i messaggi SNS - VERSIONE UNIFICATA
 */
export const handler: SNSHandler = async (event: SNSEvent) => {
  console.log("Processing SNS notifications:", JSON.stringify(event, null, 2));

  const results: ProcessingResult[] = [];

  for (const record of event.Records) {
    try {
      console.log("Processing SNS record:", record.Sns.MessageId);

      const snsMessage: MealPlanSNSMessage = JSON.parse(record.Sns.Message);
      console.log("Parsed SNS message:", JSON.stringify(snsMessage));

      // Determina lo status basato sul tipo di messaggio SNS
      let status: string;
      let error: string | null = null;

      switch (snsMessage.type) {
        case "MEAL_PLAN_GENERATED":
          status = "GENERATED";
          break;
        case "MEAL_PLAN_FAILED":
          status = "FAILED";
          error = snsMessage.details?.error || "Unknown error occurred";
          break;
        default:
          console.warn("Unknown notification type:", snsMessage.type);
          results.push({
            messageId: record.Sns.MessageId,
            status: "skipped",
            reason: `Unknown notification type: ${snsMessage.type}`,
          });
          continue;
      }

      // UNA SOLA MUTATION PER TUTTI I TIPI
      const subscriptionMutation: AppSyncNotificationMutation = {
        mutation: `
          mutation NotifyMealPlanStatusChanged($input: MealPlanNotificationInput!) {
            notifyMealPlanStatusChanged(input: $input) {
              userId
              mealPlanId
              status
              timestamp
              error
            }
          }
        `,
        variables: {
          input: {
            userId: snsMessage.userId,
            mealPlanId: snsMessage.mealPlanId,
            status: status,
            timestamp: snsMessage.timestamp,
            error: error,
          },
        },
      };

      // Triggera la subscription AppSync
      await triggerAppSyncSubscription(snsMessage.userId, subscriptionMutation);

      results.push({
        messageId: record.Sns.MessageId,
        status: "success",
        userId: snsMessage.userId,
        type: snsMessage.type,
      });
    } catch (error) {
      console.error("Failed to process SNS record:", {
        messageId: record.Sns.MessageId,
        error: error instanceof Error ? error.message : String(error),
        record: record,
      });

      results.push({
        messageId: record.Sns.MessageId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Log del riepilogo
  const successCount = results.filter((r) => r.status === "success").length;
  const failureCount = results.filter((r) => r.status === "failed").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  console.log(`Notification processing complete:`, {
    total: results.length,
    success: successCount,
    failed: failureCount,
    skipped: skippedCount,
    results: results,
  });

  // Se tutti i messaggi sono falliti, lancia un errore per retry
  if (failureCount > 0 && successCount === 0) {
    throw new Error(`All ${failureCount} notifications failed to process`);
  }
};

// Export della funzione per testing
export { triggerAppSyncSubscription };
