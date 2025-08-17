import { UserTypeEnum } from '../../types/UserTypeEnum';
import { SubscriptionStatus } from '../../types/SubscriptionStatus';
import {
  createUser,
  deleteUser,
  findUserByEmail,
  linkSocialAccount,
  setUserPassword,
} from '../utils';
import { PreSignUpTriggerHandler, PreSignUpTriggerEvent } from 'aws-lambda';

export const handler: PreSignUpTriggerHandler = async (
  event: PreSignUpTriggerEvent,
) => {
  console.log('preSignup event', JSON.stringify(event, null, 2));

  const { triggerSource, userPoolId, userName, request } = event;

  if (triggerSource === 'PreSignUp_SignUp') {
    // A request coming from the app must have the role and subscriptionStatus attributes

    const role: string = request.userAttributes['custom:role'];
    const subscriptionStatus: string =
      request.userAttributes['custom:subscriptionStatus'];

    if (!role) {
      console.error('User role not defined');
      throw new Error('User role is required');
    }

    if (!Object.values(UserTypeEnum).includes(role as any)) {
      console.error(`Invalid role: ${role}`);
      throw new Error(
        `Invalid role: ${role}. Allowed roles are: USER, NUTRITIONIST`,
      );
    }

    if (!subscriptionStatus) {
      console.error('Subscription status not defined');
      throw new Error('Subscription status is required');
    }

    if (
      !Object.values(SubscriptionStatus).includes(subscriptionStatus as any)
    ) {
      console.error(`Invalid subscription status: ${subscriptionStatus}`);
      throw new Error(
        `Invalid subscription status: ${subscriptionStatus}. Allowed subscription statuses are: FREE, PAID`,
      );
    }
  } else if (triggerSource === 'PreSignUp_ExternalProvider') {
    const {
      userAttributes: { email, given_name, family_name },
    } = request;

    // Normalize email to handle case sensitivity
    const normalizedEmail = email.toLowerCase();

    // Extract provider name and user ID from userName (e.g., "Google_123456789")
    let [providerName, providerUserId] = userName.split('_');
    providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);

    try {
      // Check if the user already exists in the Cognito user pool
      const user = await findUserByEmail(normalizedEmail, userPoolId);

      if (user) {
        // Link the federated account to the existing user
        await linkSocialAccount({
          userPoolId,
          cognitoUsername: user.Username,
          providerName,
          providerUserId,
        });
        console.log(
          `Linked ${providerName} account to existing user: ${user.Username}`,
        );
      } else {
        try {
          // Create a new user in the Cognito user pool
          var newUser = await createUser({
            userPoolId,
            email: normalizedEmail,
            givenName: given_name,
            familyName: family_name,
          });

          if (!newUser) {
            throw new Error('Failed to create user in Cognito');
          }
        } catch (error) {
          console.error('Error during account creation:', error);
          throw error;
        }

        try {
          // Set a permanent password for the new user
          await setUserPassword({
            userPoolId,
            email: normalizedEmail,
          });

          // Link the federated account to the new user
          await linkSocialAccount({
            userPoolId,
            cognitoUsername: newUser.Username,
            providerName,
            providerUserId,
          });

          console.log(
            `Created and linked ${providerName} account for new user: ${newUser.Username}`,
          );

          // Auto-confirm and auto-verify the user
          event.response.autoConfirmUser = true;
          event.response.autoVerifyEmail = true;
        } catch (error) {
          console.error('Error during account setup:', error);

          // Clean up by deleting the user
          try {
            await deleteUser({
              userPoolId,
              userName: newUser.Username!,
            });
          } catch (error) {
            console.error('Error during cleanup:', error);
          }

          throw error;
        }
      }
    } catch (error) {
      console.error('Error during PreSignUp_ExternalProvider handling:', error);
      throw error;
    }
  }

  // Return the event to continue the signup process
  return event;
};
