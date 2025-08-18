import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface AppSyncApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  mealPlanningTable: dynamodb.ITableV2;
}

export class AppSyncApiStack extends cdk.Stack {
  public readonly graphqlUrl: string;
  public readonly apiId: string;

  constructor(scope: Construct, id: string, props: AppSyncApiStackProps) {
    super(scope, id, props);

    // Create the AppSync API using your comprehensive GraphQL schema
    const api = new appsync.GraphqlApi(this, "MealPlanningApi", {
      name: "MealPlanningApi",
      definition: appsync.Definition.fromFile("graphql/schema.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
          },
        },
        // IMPORTANT: Add IAM as an additional authorization mode
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.IAM,
          },
        ],
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_WEEK,
        excludeVerboseContent: false,
      },
      xrayEnabled: true,
    });

    // Add DynamoDB table as a data source
    const tableDS = api.addDynamoDbDataSource(
      "MealPlanningDynamoDataSource",
      props.mealPlanningTable,
    );

    // --------------------------------------------------------------------
    // RESOLVERS FOR USER DETAILS (FORMERLY PREFERENCES)
    // --------------------------------------------------------------------

    // Resolver for Query.getUserDetails
    tableDS.createResolver("QueryGetUserDetailsResolver", {
      typeName: "Query",
      fieldName: "getUserDetails",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/getUserDetails-request.vtl",
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/getUserDetails-response.vtl",
      ),
    });

    // ====================================================================
    //         PIPELINE RESOLVER for Query.getTodaysPlanAndStatus
    // ====================================================================

    // --- Pipeline Function 1: Get UserDetails (to find active plan ID) ---
    const getUserDetailsFunc = new appsync.AppsyncFunction(
      this,
      "GetUserDetailsFunc",
      {
        name: "getUserDetailsFunc",
        api: api,
        dataSource: tableDS,
        requestMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/pipeline.getTodaysPlanAndStatus.func1-getUserDetails-request.vtl",
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/pipeline.getTodaysPlanAndStatus.func1-getUserDetails-response.vtl",
        ),
      },
    );

    // --- Pipeline Function 2: Get Active MealPlan ---
    const getActiveMealPlanFunc = new appsync.AppsyncFunction(
      this,
      "GetActiveMealPlanFunc",
      {
        name: "getActiveMealPlanFunc",
        api: api,
        dataSource: tableDS,
        requestMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/pipeline.getTodaysPlanAndStatus.func2-getMealPlan-request.vtl",
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/pipeline.getTodaysPlanAndStatus.func2-getMealPlan-response.vtl",
        ),
      },
    );

    // --- Pipeline Function 3: Get Today's Completed Meal Log ---
    const getCompletedLogFunc = new appsync.AppsyncFunction(
      this,
      "GetCompletedLogFunc",
      {
        name: "getCompletedLogFunc",
        api: api,
        dataSource: tableDS,
        requestMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/pipeline.getTodaysPlanAndStatus.func3-getCompletedLog-request.vtl",
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/pipeline.getTodaysPlanAndStatus.func3-getCompletedLog-response.vtl",
        ),
      },
    );

    // --- Pipeline Resolver Definition ---
    new appsync.Resolver(this, "PipelineGetTodaysPlanAndStatusResolver", {
      api: api,
      typeName: "Query",
      fieldName: "getTodaysPlanAndStatus",
      // Define the sequence of functions
      pipelineConfig: [
        getUserDetailsFunc,
        getActiveMealPlanFunc,
        getCompletedLogFunc,
      ],
      // Request mapping template for the pipeline resolver itself (usually simple)
      requestMappingTemplate: appsync.MappingTemplate.fromString("{}"),
      // Response mapping template - combines results from the functions
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/pipeline.getTodaysPlanAndStatus-response.vtl",
      ),
    });

    // ====================================================================
    //         PIPELINE RESOLVER for Query.getActiveMealPlan
    // ====================================================================
    new appsync.Resolver(this, "PipelineGetActiveMealPlanResolver", {
      api: api,
      typeName: "Query",
      fieldName: "getActiveMealPlan",
      pipelineConfig: [getUserDetailsFunc, getActiveMealPlanFunc],
      requestMappingTemplate: appsync.MappingTemplate.fromString("{}"),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/pipeline.getActiveMealPlan-response.vtl",
      ),
    });

    // ====================================================================
    //                      PIPELINE RESOLVER UpdateMyUserDetails
    // ====================================================================
    const updateUserDetailsFunction = new appsync.AppsyncFunction(
      this,
      "UpdateUserDetailsFunctionForUserDetails",
      {
        api,
        name: "UpdateUserDetailsFunctionForUserDetails",
        dataSource: tableDS,
        runtime: appsync.FunctionRuntime.JS_1_0_0,
        code: appsync.Code.fromAsset(
          "vtl-templates/pipeline.updateUserDetails.UpdateUserDetails.js",
        ),
      },
    );

    const getUserDetailsFunction = new appsync.AppsyncFunction(
      this,
      "GetUserDetailsFunctionForUserDetails",
      {
        api,
        name: "GetUserDetailsFunction",
        dataSource: tableDS,
        requestMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/getUserDetails-request.vtl",
        ),
        responseMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/getUserDetails-response.vtl",
        ),
      },
    );

    const pipelineResolver = new appsync.Resolver(
      this,
      "MutationUpdateUserDetailsResolver",
      {
        api,
        typeName: "Mutation",
        fieldName: "updateUserDetails",
        pipelineConfig: [updateUserDetailsFunction, getUserDetailsFunction],
        requestMappingTemplate:
          appsync.MappingTemplate.fromString("$util.toJson({})"), // <-- ADD THIS
        responseMappingTemplate: appsync.MappingTemplate.fromFile(
          "vtl-templates/pipeline.updateUserDetails-response.vtl",
        ),
      },
    );

    // ====================================================================
    //                      MUTATION RESOLVERS
    // ====================================================================

    // --- Resolver for Mutation.setActiveMealPlan ---
    // --- Lambda Data Source for setActiveMealPlan ---
    const setActiveMealPlanLambda = new lambda.Function(
      this,
      "SetActiveMealPlanLambda",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "index.handler",
        code: lambda.Code.fromAsset("src/lambda/setActiveMealPlan"),
        environment: {
          TABLE_NAME: props.mealPlanningTable.tableName,
        },
      },
    );

    props.mealPlanningTable.grantReadWriteData(setActiveMealPlanLambda);

    const setActiveMealPlanLambdaDS = api.addLambdaDataSource(
      "SetActiveMealPlanLambdaDS",
      setActiveMealPlanLambda,
    );

    setActiveMealPlanLambdaDS.createResolver(
      "MutationSetActiveMealPlanResolver",
      {
        typeName: "Mutation",
        fieldName: "setActiveMealPlan",
      },
    );

    tableDS.createResolver("MutationMarkMealAsCompletedResolver", {
      typeName: "Mutation",
      fieldName: "markMealAsCompleted",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/mutation.markMealAsCompleted-request.vtl",
      ), // Ensure this file exists and has the Set logic
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/mutation.markMealAsCompleted-response.vtl",
      ),
    });

    // --- Add Resolver for Unmark Meal ---
    tableDS.createResolver("MutationUnmarkMealAsCompletedResolver", {
      // New Resolver definition
      typeName: "Mutation",
      fieldName: "unmarkMealAsCompleted", // New field name from updated schema
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/mutation.unmarkMealAsCompleted-request.vtl",
      ), // New VTL file
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/mutation.unmarkMealAsCompleted-response.vtl",
      ), // New VTL file
    });

    // --- Resolver for Mutation.createMealPlan ---
    tableDS.createResolver("MutationCreateMealPlanResolver", {
      typeName: "Mutation",
      fieldName: "createMealPlan",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset("vtl-templates/mutation.createMealPlan.js"),
    });

    // --- Resolver for Mutation.deleteMealPlan ---
    tableDS.createResolver("MutationDeleteMealPlanResolver", {
      typeName: "Mutation",
      fieldName: "deleteMealPlan",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset("vtl-templates/mutation.deleteMealPlan.js"),
    });

    // --- Resolver for Mutation.modifyMealPlan ---
    tableDS.createResolver("MutationModifyMealPlanResolver", {
      typeName: "Mutation",
      fieldName: "modifyMealPlan",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset("vtl-templates/mutation.modifyMealPlan.js"),
    });

    // --- Pipeline Functions for validateMealPlan ---
    const getMealPlanKeysByMealPlanIdFunc = new appsync.AppsyncFunction(
      this,
      "GetMealPlanKeysByMealPlanIdFunc",
      {
        name: "getMealPlanKeysByMealPlanIdFunc",
        api: api,
        dataSource: tableDS,
        runtime: appsync.FunctionRuntime.JS_1_0_0,
        code: appsync.Code.fromAsset(
          "vtl-templates/getMealPlanKeysByMealPlanId.js",
        ),
      },
    );

    const updateMealPlanValidationStatusFunc = new appsync.AppsyncFunction(
      this,
      "UpdateMealPlanValidationStatusFunc",
      {
        name: "updateMealPlanValidationStatusFunc",
        api: api,
        dataSource: tableDS,
        runtime: appsync.FunctionRuntime.JS_1_0_0,
        code: appsync.Code.fromAsset(
          "vtl-templates/updateMealPlanValidationStatus.js",
        ),
      },
    );

    // --- Pipeline Resolver for Mutation.validateMealPlan ---
    new appsync.Resolver(this, "PipelineValidateMealPlanResolver", {
      api: api,
      typeName: "Mutation",
      fieldName: "validateMealPlan",
      pipelineConfig: [
        getMealPlanKeysByMealPlanIdFunc,
        updateMealPlanValidationStatusFunc,
      ],
      requestMappingTemplate: appsync.MappingTemplate.fromString("{}"),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($ctx.prev.result)",
      ),
    });

    // --- Resolver for Query.listMyMealPlans ---
    tableDS.createResolver("QueryListMyMealPlansResolver", {
      typeName: "Query",
      fieldName: "listMyMealPlans",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset("vtl-templates/query.listMyMealPlans.js"),
    });

    // --- Resolver for Query.getMealPlanById ---
    tableDS.createResolver("QueryGetMealPlanByIdResolver", {
      typeName: "Query",
      fieldName: "getMealPlanById",
      requestMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/query.getMealPlanById-request.vtl",
      ),
      responseMappingTemplate: appsync.MappingTemplate.fromFile(
        "vtl-templates/query.getMealPlanById-response.vtl",
      ),
    });

    // --- Resolver for Query.listNutritionists ---
    tableDS.createResolver("QueryListNutritionistsResolverNew", {
      typeName: "Query",
      fieldName: "listNutritionists",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset("vtl-templates/query.listNutritionists.js"),
    });

    // --- Resolver for Mutation.requestValidation ---
    tableDS.createResolver("MutationRequestValidationResolver", {
      typeName: "Mutation",
      fieldName: "requestValidation",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        "vtl-templates/mutation.requestValidation.js",
      ),
    });

    // --- Resolver for Query.listMyAssignedMealPlans ---
    tableDS.createResolver("QueryListMyAssignedMealPlansResolver", {
      typeName: "Query",
      fieldName: "listMyAssignedMealPlans",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        "vtl-templates/query.listMyAssignedMealPlans.js",
      ),
    });

    // --- Resolver for Query.getMyNutritionistProfile ---
    tableDS.createResolver("QueryGetMyNutritionistProfileResolver", {
      typeName: "Query",
      fieldName: "getMyNutritionistProfile",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        "vtl-templates/query.getMyNutritionistProfile.js",
      ),
    });

    // --- Resolver for Mutation.updateMyNutritionistProfile ---
    tableDS.createResolver("MutationUpdateMyNutritionistProfileResolver", {
      typeName: "Mutation",
      fieldName: "updateMyNutritionistProfile",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        "vtl-templates/mutation.updateMyNutritionistProfile.js",
      ),
    });

    // ====================================================================
    // ====================================================================
    //                  MEAL PLAN GENERATION (NEW SECTION)
    // ====================================================================
    // ====================================================================

    // Crea SNS Topic per le notifiche
    const mealPlanNotificationTopic = new sns.Topic(
      this,
      "MealPlanNotificationTopic",
      {
        topicName: "meal-plan-notifications",
      },
    );

    // --- 1. Reference the Secret for the Gemini API Key ---
    // IMPORTANT: Replace 'your/gemini/secret/arn' with the actual ARN of your secret in Secrets Manager
    const geminiApiSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      "GeminiApiSecret",
      "arn:aws:secretsmanager:us-west-2:537124974525:secret:GeminiApiSecret-FoYZ9f",
    );

    // --- 2. Define the Asynchronous Generator Lambda ---
    const generatorLambda = new NodejsFunction(this, "GeneratorHandler", {
      functionName: "meal-plan-generator-handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "handler",
      entry: "src/lambda/meal-generator-generation-handler/index.ts",
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      bundling: {
        format: OutputFormat.CJS,
        bundleAwsSDK: false,
        minify: false, // Minify the code
        sourceMap: true, // Generate source maps
        externalModules: [
          "@aws-sdk/client-secrets-manager",
          "@aws-sdk/signature-v4",
          "@aws-sdk/protocol-http",
        ],
      },
      environment: {
        TABLE_NAME: props.mealPlanningTable.tableName,
        GEMINI_SECRET_ARN: geminiApiSecret.secretArn,
        SNS_TOPIC_ARN: mealPlanNotificationTopic.topicArn,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant the generator lambda permission to read the secret
    geminiApiSecret.grantRead(generatorLambda);

    // Grant the permission to publish to the SNS topic
    mealPlanNotificationTopic.grantPublish(generatorLambda);

    // Grant the generator lambda permission to write to the DynamoDB table
    props.mealPlanningTable.grantReadWriteData(generatorLambda);

    // --- 3. Define the Synchronous Request Handler Lambda ---
    const requestLambda = new NodejsFunction(this, "RequestHandler", {
      functionName: "meal-plan-request-handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "handler",
      entry: "src/lambda/meal-generation-request-handler/index.ts", // Adjust path as needed
      timeout: cdk.Duration.seconds(30),
      environment: {
        MEALPLANS_TABLE_NAME: props.mealPlanningTable.tableName,
        GENERATOR_FUNCTION_NAME: generatorLambda.functionName,
      },
      bundling: {
        format: OutputFormat.ESM,
        bundleAwsSDK: false,
        minify: false, // Minify the code
        sourceMap: true, // Generate source maps
        externalModules: [
          "@aws-sdk/client-dynamodb",
          "@aws-sdk/lib-dynamodb",
          "@aws-sdk/client-lambda",
        ],
      },
    });

    // Grant the request lambda permission to write to the DynamoDB table
    props.mealPlanningTable.grantReadWriteData(requestLambda);

    // Grant the request lambda permission to invoke the generator lambda
    generatorLambda.grantInvoke(requestLambda);

    // --- 4. Create the AppSync Data Source and Resolver ---
    // Create a Lambda Data Source for the request handler
    const requestLambdaDS = api.addLambdaDataSource(
      "RequestLambdaDataSource",
      requestLambda,
    );

    // Create the resolver for the `requestNewMealPlan` mutation
    requestLambdaDS.createResolver("RequestNewMealPlanResolver", {
      typeName: "Mutation",
      fieldName: "requestNewMealPlan",
    });

    // --- 5.
    // Crea lambda per gestire le notifiche
    const notificationLambda = new NodejsFunction(this, "NotificationHandler", {
      functionName: "meal-plan-notification-handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "handler",
      entry: "src/lambda/meal-generation-notification-handler/index.ts",
      environment: {
        APPSYNC_API_URL: api.graphqlUrl,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256, // ← Memoria sufficiente
      bundling: {
        format: OutputFormat.CJS,
        bundleAwsSDK: false,
        minify: false, // Minify the code
        sourceMap: true, // Generate source maps
        externalModules: [
          "@aws-sdk/credential-providers",
          "@aws-sdk/signature-v4",
          "@aws-sdk/protocol-http",
        ],
      },
      logRetention: logs.RetentionDays.ONE_WEEK, // ← Log retention
    });

    // Concedi permessi AppSync alla notification lambda
    notificationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["appsync:GraphQL"],
        resources: [api.arn + "/*"],
      }),
    );

    // Collega SNS alla notification lambda
    mealPlanNotificationTopic.addSubscription(
      new snsSubscriptions.LambdaSubscription(notificationLambda, {
        deadLetterQueue: new sqs.Queue(this, "NotificationDLQ", {
          queueName: "meal-plan-notification-dlq",
        }),
      }),
    );

    // Crea un data source "None" per le notification mutations (se non esiste già)
    const noneDS = api.addNoneDataSource("NotificationDataSource");

    noneDS.createResolver("OnMealPlanStatusChangedSubscriptionResolver", {
      typeName: "Subscription",
      fieldName: "onMealPlanStatusChanged",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        "vtl-templates/subscription.onMealPlanStatusChanged.js",
      ),
    });

    // Resolver per la notification mutation unificata
    noneDS.createResolver("NotifyMealPlanStatusChangedResolver", {
      typeName: "Mutation",
      fieldName: "notifyMealPlanStatusChanged",
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(
        "vtl-templates/mutation.notifyMealPlanStatusChanged.js",
      ),
    });

    // --- End of Meal Plan Generation Section ---

    // --------------------------------------------------------------------
    // OTHER RESOLVERS WILL BE ADDED LATER
    // --------------------------------------------------------------------

    // Store API details for outputs or cross-stack references
    this.graphqlUrl = api.graphqlUrl;
    this.apiId = api.apiId;

    // Outputs
    new cdk.CfnOutput(this, "GraphQLAPIURL", {
      value: api.graphqlUrl,
      description: "The URL of the GraphQL API",
    });
    new cdk.CfnOutput(this, "GraphQLAPIId", {
      value: api.apiId,
      description: "The ID of the GraphQL API",
    });
    // Region output removed to avoid TypeScript compilation issues
  }
}
