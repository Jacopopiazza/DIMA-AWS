import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as cognito_identity from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Retrieve the secret from Secrets Manager
    const googleSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "SIGN_IN_WITH_GOOGLE",
      "SIGN_IN_WITH_GOOGLE", // Name of the secret in Secrets Manager
    );

    // Define the Pre-Signup Lambda Function
    const preSignUpLambda = new NodejsFunction(this, "PreSignUpLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: "src/lambda/pre-sign-up/index.ts",
      handler: "handler",
      bundling: {
        format: OutputFormat.ESM,
        bundleAwsSDK: false,
        minify: false, // Minify the code
        sourceMap: true, // Generate source maps
      },
    });

    // Define the Pre-Signup Lambda Function
    const postConfirmation = new NodejsFunction(
      this,
      "PostConfirmationLambda",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: "src/lambda/post-confirmation/index.ts",
        handler: "handler",
        bundling: {
          format: OutputFormat.ESM,
          bundleAwsSDK: false,
          minify: false, // Minify the code
          sourceMap: true, // Generate source maps
        },
        environment: {
          TABLE_NAME: "MealPlanningTable",
        },
      },
    );

    // Define the Cognito User Pool
    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "MyUserPool",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
        gender: {
          required: false,
          mutable: true,
        },
        birthdate: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        profilePicture: new cognito.StringAttribute({ mutable: true }),
        subscriptionStatus: new cognito.StringAttribute({ mutable: true }),
        role: new cognito.StringAttribute({ mutable: false }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      lambdaTriggers: {
        preSignUp: preSignUpLambda,
        postConfirmation: postConfirmation,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
    });

    // Grant the Lambda function permissions to interact with Cognito
    preSignUpLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:AdminLinkProviderForUser",
          "cognito-idp:ListUsers",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminDeleteUser",
        ],
        resources: ["*"], // needed to avoid circular dependency
      }),
    );

    postConfirmation.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminListGroupsForUser",
        ],
        resources: ["*"],
      }),
    );

    // Add DynamoDB permissions for creating nutritionist profiles
    postConfirmation.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
        ],
        resources: ["*"], // In production, specify the exact table ARN
      }),
    );

    // Define User Pool Groups
    const userGroup = new cognito.CfnUserPoolGroup(this, "UserGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "USERS",
      precedence: 0,
    });

    const nutritionistGroup = new cognito.CfnUserPoolGroup(
      this,
      "NutritionistGroup",
      {
        userPoolId: this.userPool.userPoolId,
        groupName: "NUTRITIONISTS",
        precedence: 1,
      },
    );

    const adminGroup = new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "ADMIN",
      precedence: 2,
    });

    // Define the Google Identity Provider
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(
      this,
      "GoogleProvider",
      {
        clientId: googleSecret
          .secretValueFromJson("GOOGLE_CLIENT_ID")
          .unsafeUnwrap(), // Use Secrets Manager or SSM Parameter Store for production
        clientSecretValue: googleSecret.secretValueFromJson(
          "GOOGLE_CLIENT_SECRET",
        ), // Use Secrets Manager or SSM Parameter Store for production
        userPool: this.userPool,
        scopes: ["profile", "email", "openid"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
          profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
          emailVerified: cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED,
        },
      },
    );

    // Add a domain to the User Pool
    const userPoolDomain = this.userPool.addDomain("MyUserPoolDomain", {
      cognitoDomain: {
        domainPrefix: "e2c748be1d135a2c6733", // Replace with your unique domain prefix
      },
    });

    // Define the User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      oAuth: {
        callbackUrls: ["http://localhost:3000/profile", "dima://auth"],
        logoutUrls: ["http://localhost:3000/", "dima://logout"],
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.days(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Create a Cognito Identity Pool (with unauthenticated access disabled)
    const identityPool = new cognito_identity.CfnIdentityPool(
      this,
      "MyIdentityPool",
      {
        identityPoolName: "MyIdentityPool",
        allowUnauthenticatedIdentities: false, // Disable unauthenticated access
        cognitoIdentityProviders: [
          {
            clientId: userPoolClient.userPoolClientId,
            providerName: this.userPool.userPoolProviderName,
          },
        ],
      },
    );

    // Create IAM Role for Authenticated Users
    const authenticatedRole = new iam.Role(this, "AuthenticatedRole", {
      assumedBy: new iam.FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
    });

    userPoolClient.node.addDependency(googleProvider);

    // Output the User Pool ID and Client ID
    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, "IdentityPoolId", { value: identityPool.ref });

    new cdk.CfnOutput(this, "CognitoOAuthRedirectUri", {
      value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
      description: "The OAuth redirect URI for the Cognito User Pool",
    });
  }
}
