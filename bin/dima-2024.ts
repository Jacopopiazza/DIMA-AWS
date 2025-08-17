#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AppSyncApiStack } from "../lib/appsync-stack";
import { AuthStack } from "../lib/auth-stack";
import { DataStack } from "../lib/data-stack";

const app = new cdk.App();

const authStack = new AuthStack(app, "AuthStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: "537124974525", region: "us-west-2" },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// Create the DataStack for your DynamoDB table.
const dataStack = new DataStack(app, "DataStack", {
  userPool: authStack.userPool,
  env: { account: "537124974525", region: "us-west-2" },
  // additional properties if needed
});

// Create the AppSync API stack, passing in references to the User Pool and DynamoDB table.
new AppSyncApiStack(app, "AppSyncApiStack", {
  userPool: authStack.userPool,
  mealPlanningTable: dataStack.mealPlanningTable,
  env: { account: "537124974525", region: "us-west-2" },
});
