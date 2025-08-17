import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface DataStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
}

export class DataStack extends cdk.Stack {
  public readonly mealPlanningTable: dynamodb.TableV2;
  public readonly setActiveMealPlanLambda: lambda.Function;
  public readonly assetsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // Create S3 bucket for assets (images, documents, etc.)
    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `dima-assets-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // TODO: Change to RETAIN for prod
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'], // TODO: Restrict to your app domains in production
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Create IAM policy for authenticated users to upload assets
    const uploadPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:PutObject',
            's3:PutObjectAcl',
            's3:GetObject',
            's3:DeleteObject',
          ],
          resources: [
            this.assetsBucket.bucketArn,
            `${this.assetsBucket.bucketArn}/*`,
          ],
          conditions: {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': props.userPool.userPoolId,
            },
          },
        }),
      ],
    });

    // Export the bucket name for cross-stack references
    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: this.assetsBucket.bucketName,
      exportName: 'AssetsBucketName',
    });

    new cdk.CfnOutput(this, 'AssetsBucketArn', {
      value: this.assetsBucket.bucketArn,
      exportName: 'AssetsBucketArn',
    });

    const mealPlanningTableProps: dynamodb.TablePropsV2 = {
      billing: dynamodb.Billing.onDemand(),
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // TODO: Change to RETAIN for prod
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
      tableName: 'MealPlanningTable',
    };

    this.mealPlanningTable = new dynamodb.TableV2(
      this,
      'MealPlanningTable',
      mealPlanningTableProps,
    );

    // GSI1 - For listing nutritionists (listNutritionists query)
    // NutritionistProfile items will have:
    // GSI1PK = "NUTR_PROFILES_ALL" (constant value to gather all profiles)
    // GSI1SK = "NAME#{FamilyName}#{GivenName}" OR "NUTRID#{NutritionistID}" (for sorting)
    this.mealPlanningTable.addGlobalSecondaryIndex({
      indexName: 'GSI1_NutritionistListings',
      partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: [
        // Attributes from NutritionistProfile type needed for the list
        'NutritionistID', // This is the ID from the main PK (e.g., value of NUTR#<id>)
        'GivenName',
        'FamilyName',
        'Specialization',
        'ProfilePictureURL',
        'IsAvailable',
        'Bio',
      ],
    });

    // GSI2 - For retrieving a Nutritionist's chats, sorted by recency (listMyAssignedChats query)
    // ChatMetadata items will have:
    // GSI2PK = "NUTR#{NutritionistID}"
    // GSI2SK = "LMT#{LastMessageTimestampISO}" (LMT for Last Message Timestamp)
    this.mealPlanningTable.addGlobalSecondaryIndex({
      indexName: 'GSI2_NutritionistChatsByRecency',
      partitionKey: { name: 'GSI2PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: [
        // Attributes from ChatMetadata needed for the list
        'ChatID', // Actual ChatID (value from PK: CHAT#<id>)
        'UserID',
        'MealPlanID',
        'PlanName',
        'UserGivenName',
        'LastMessageTimestamp',
        'LastMessageSnippet',
        'NutritionistUnreadCount',
        // Add 'CreatedAt' if you ever want to sort by creation time as a fallback
      ],
    });

    // GSI3 - For retrieving a User's chats, sorted by recency (listMyChats query)
    // ChatMetadata items will have:
    // GSI3PK = "USER#{UserID}"
    // GSI3SK = "LMT#{LastMessageTimestampISO}"
    this.mealPlanningTable.addGlobalSecondaryIndex({
      indexName: 'GSI3_UserChatsByRecency',
      partitionKey: { name: 'GSI3PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: [
        // Attributes from ChatMetadata needed for the list
        'ChatID',
        'MealPlanID',
        'NutritionistID',
        'PlanName',
        'NutritionistGivenName',
        'LastMessageTimestamp',
        'LastMessageSnippet',
        'UserUnreadCount',
        // Add 'CreatedAt' if you ever want to sort by creation time as a fallback
      ],
    });

    // GSI4 - For retrieving meal plans assigned to a nutritionist (listMyAssignedMealPlans query)
    // MealPlan items will have:
    // GSI4PK = "NUTR#{NutritionistID}"
    // GSI4SK = "PLAN#{MealPlanID}"
    this.mealPlanningTable.addGlobalSecondaryIndex({
      indexName: 'GSI4_NutritionistMealPlans',
      partitionKey: { name: 'GSI4PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI4SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: [
        // Attributes from MealPlan needed for the list
        'PlanName',
        'StartDate',
        'EndDate',
        'Status',
        'ValidationStatus',
        'AssignedNutritionistId',
        'UserId',
        'GeneratedAt',
        // Add 'CreatedAt' if you ever want to sort by creation time as a fallback
      ],
    });

    // GSI4 - For retrieving a User's PlanDayCompletion records, sorted by date across plans (listPlanCompletions query or general history)
    // PlanDayCompletion items will have:
    // GSI4PK = "USER#{UserID}"
    // GSI4SK = "DATE#{Date}_PLAN#{PlanID}" (Date as YYYY-MM-DD)
    this.mealPlanningTable.addGlobalSecondaryIndex({
      indexName: 'GSI4_UserCompletionsByDate',
      partitionKey: { name: 'GSI4PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'GSI4SK', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: [
        // Attributes from PlanDayCompletion needed
        'PlanID', // Actual PlanID
        'Date',
        'CompletedMealNames',
        'UpdatedAt',
        // Ensure the main table items for PlanDayCompletion also store UserID and the GSI keys
      ],
    });

    // GSI_AssignedNutritionistId - For retrieving meal plans assigned to a nutritionist by assignedNutritionistId
    // MealPlan items will have:
    // assignedNutritionistId = <nutritionistId>
    // mealPlanId = <mealPlanId>
    this.mealPlanningTable.addGlobalSecondaryIndex({
      indexName: 'GSI_AssignedNutritionistId',
      partitionKey: {
        name: 'assignedNutritionistId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: 'mealPlanId', type: dynamodb.AttributeType.STRING }, // Optional, for sorting
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI_MealPlanId - For retrieving meal plans by mealPlanId
    // MealPlan items will have:
    // mealPlanId = <mealPlanId>
    this.mealPlanningTable.addGlobalSecondaryIndex({
      indexName: 'GSI_MealPlanId',
      partitionKey: { name: 'mealPlanId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Export the table name for cross-stack references
    new cdk.CfnOutput(this, 'MealPlanningTableId', {
      value: this.mealPlanningTable.tableName,
      exportName: 'MealPlanningTable',
    });

    // Export the table name for cross-stack references
    new cdk.CfnOutput(this, 'MealPlanningTableName', {
      value: this.mealPlanningTable.tableName,
      exportName: 'MealPlanningTableName',
    });
  }
}
