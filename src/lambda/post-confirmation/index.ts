import {
  PostConfirmationTriggerEvent,
  PostConfirmationTriggerHandler,
} from 'aws-lambda';

import { UserTypeEnum } from '../../types/UserTypeEnum';
import { addUserToGroup, getGroupsForUser } from '../utils';

export const handler: PostConfirmationTriggerHandler = async (
  event: PostConfirmationTriggerEvent,
) => {
  console.log(
    'PostConfirmationTriggerHandler event: ',
    JSON.stringify(event, null, 2),
  );

  const { userPoolId, userName, request } = event;
  const userAttributes = request.userAttributes;

  // Check user role and add to appropriate group
  const userRole = userAttributes['custom:role'];

  if (!userRole) {
    console.error('User role not defined');
    throw new Error('User role is required');
  }

  if (!Object.values(UserTypeEnum).includes(userRole as any)) {
    console.error(`Invalid role: ${userRole}`);
    throw new Error(
      `Invalid role: ${userRole}. Allowed roles are: USER, NUTRITIONIST`,
    );
  }

  try {
    const groups = await getGroupsForUser(userPoolId, userName);
    console.log(`Groups for user ${userName}: ${groups}`);

    if (groups.includes('USERS') || groups.includes('NUTRITIONISTS')) {
      console.log(`User ${userName} already in group`);
      return event;
    }
  } catch (error) {
    console.error('Error getting groups for user:', error);
    throw error;
  }

  try {
    // Set group name based on role
    const groupName =
      userRole === UserTypeEnum.USER.toString() ? 'USERS' : 'NUTRITIONISTS';

    await addUserToGroup(userPoolId, userName, groupName);

    console.log(`Added user ${userName} to group ${groupName}`);
  } catch (error) {
    console.error('Error adding user to group:', error);
    throw error;
  }

  // Return the event to continue the signup process
  return event;
};
