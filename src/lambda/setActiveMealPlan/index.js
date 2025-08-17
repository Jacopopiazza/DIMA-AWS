const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME || 'MealPlanningTable';

exports.handler = async (event) => {
  console.log('Full event received:', JSON.stringify(event, null, 2));

  const userId = event.identity && event.identity.sub;
  const planId =
    event.arguments && (event.arguments.planId || event.arguments.mealPlanId);

  console.log('Extracted userId:', userId);
  console.log('Extracted planId:', planId);

  console.log('Setting active meal plan:', { userId, planId });

  // 0. Check if the plan is already active
  const checkCurrentPlanParams = {
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: `PLAN#${planId}`,
    },
  };

  try {
    const currentPlan = await ddb.get(checkCurrentPlanParams).promise();
    console.log(
      'Current plan from DB:',
      JSON.stringify(currentPlan.Item, null, 2),
    );

    if (currentPlan.Item && currentPlan.Item.status === 'ACTIVE') {
      console.log('Plan is already active, no changes needed');
      return {
        success: true,
        message: 'Plan is already active. + ' + currentPlan.Item.status,
        mealPlanId: planId,
      };
    } else if (!currentPlan.Item) {
      console.log('Plan does not exist in database');
      return {
        success: false,
        message: 'Plan not found in database.',
        mealPlanId: planId,
      };
    }
  } catch (err) {
    console.error('Error checking current plan status:', err);
    return {
      success: false,
      message: 'Error checking current plan status',
      mealPlanId: planId,
    };
  }

  // 1. Find the current active plan for the user
  const queryParams = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    FilterExpression: '#status = :active',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':skPrefix': 'PLAN#',
      ':active': 'ACTIVE',
    },
  };

  let previousActivePlan = null;
  try {
    const result = await ddb.query(queryParams).promise();
    if (result.Items && result.Items.length > 0) {
      previousActivePlan = result.Items[0];
      console.log('Found previous active plan:', previousActivePlan.SK);
    }
  } catch (err) {
    console.error('Error querying active plan:', err);
    return {
      success: false,
      message: 'Error querying active plan',
      mealPlanId: planId,
    };
  }

  // 2. Prepare transaction items
  const transactItems = [];

  // Unset previous active plan if it exists and it's different from the new plan
  if (previousActivePlan && previousActivePlan.SK !== `PLAN#${planId}`) {
    transactItems.push({
      Update: {
        TableName: TABLE_NAME,
        Key: {
          PK: previousActivePlan.PK,
          SK: previousActivePlan.SK,
        },
        UpdateExpression: 'SET #status = :inactive',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':inactive': 'GENERATED' },
      },
    });
  }

  // Set new plan as active
  transactItems.push({
    Update: {
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `PLAN#${planId}`,
      },
      UpdateExpression: 'SET #status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':active': 'ACTIVE' },
    },
  });

  console.log('Transact items:', JSON.stringify(transactItems, null, 2));

  // 3. Execute transaction
  try {
    await ddb.transactWrite({ TransactItems: transactItems }).promise();
    console.log('Transaction completed successfully');
    return {
      success: true,
      message: 'Active plan updated successfully.',
      mealPlanId: planId,
    };
  } catch (err) {
    console.error('Transaction failed:', err);
    return {
      success: false,
      message: `Transaction failed: ${err.message}`,
      mealPlanId: planId,
    };
  }
};
