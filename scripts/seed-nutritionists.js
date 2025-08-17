const {
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Update these with your actual values
const USER_POOL_ID = "us-west-2_fQpGATfnW"; // <-- update if needed
const REGION = "us-west-2";
const TABLE_NAME = "MealPlanningTable";
const NUTRITIONISTS_GROUP = "NUTRITIONISTS";

const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function getNutritionistsFromCognito() {
  const users = [];
  let nextToken = undefined;
  do {
    const command = new ListUsersInGroupCommand({
      UserPoolId: USER_POOL_ID,
      GroupName: NUTRITIONISTS_GROUP,
      Limit: 60,
      NextToken: nextToken,
    });
    const response = await cognitoClient.send(command);
    if (response.Users) users.push(...response.Users);
    nextToken = response.NextToken;
  } while (nextToken);
  return users;
}

function buildProfileFromCognitoUser(user) {
  // You can customize these fields as needed
  const attr = (name) => {
    const found = user.Attributes.find((a) => a.Name === name);
    return found ? found.Value : "";
  };
  return {
    PK: `NUTR#${user.Username}`,
    SK: "NUTR_DETAILS",
    NutritionistID: user.Username,
    GivenName: attr("given_name"),
    FamilyName: attr("family_name"),
    Specialization: "General Nutrition",
    Bio: "Certified nutritionist helping clients achieve their health goals.",
    ProfilePictureURL: attr("profilePicture"),
    IsAvailable: true,
    GSI1PK: "NUTR_PROFILES_ALL",
    GSI1SK: `NUTRID#${user.Username}`,
  };
}

async function seedNutritionists() {
  console.log("Fetching nutritionists from Cognito...");
  const users = await getNutritionistsFromCognito();
  if (!users.length) {
    console.log("No nutritionists found in Cognito group.");
    return;
  }
  console.log(`Found ${users.length} nutritionists. Seeding DynamoDB...`);
  const results = [];
  for (const user of users) {
    const profile = buildProfileFromCognitoUser(user);
    try {
      const putCommand = new PutCommand({
        TableName: TABLE_NAME,
        Item: profile,
      });
      await docClient.send(putCommand);
      console.log(
        `Seeded nutritionist: ${profile.GivenName} ${profile.FamilyName} (${profile.NutritionistID})`,
      );
      results.push({ success: true, nutritionistId: profile.NutritionistID });
    } catch (error) {
      console.error(
        `Error seeding nutritionist ${profile.NutritionistID}:`,
        error,
      );
      results.push({
        success: false,
        nutritionistId: profile.NutritionistID,
        error: error.message,
      });
    }
  }
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;
  console.log(
    `Seeding complete. Success: ${successCount}, Failures: ${failureCount}`,
  );
  if (failureCount > 0) {
    console.log(
      "Failed items:",
      results.filter((r) => !r.success),
    );
  }
}

seedNutritionists().catch(console.error);
