import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  UserType,
  AdminUpdateUserAttributesCommand,
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { SubscriptionStatus } from "../types/SubscriptionStatus";
import { UserTypeEnum } from "../types/UserTypeEnum";

const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

const generatePassword = (length: number = 16): string => {
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const specialChars = "!@#$%^&*()_+~`|}{[]\:;?><,./-=";

  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  password += numberChars[Math.floor(Math.random() * numberChars.length)]; // enforce password policy
  password += specialChars[Math.floor(Math.random() * specialChars.length)]; // enforce password policy
  password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]; // enforce password policy
  password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]; // enforce password policy

  return password;
};

export const setUserPassword = async ({
  userPoolId,
  email,
}: {
  userPoolId: string;
  email: string;
}) => {
  const adminChangePasswordCommand = new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: email, // the email is the username
    Password: generatePassword(), // generate a random password
    Permanent: true, // this is needed to set the password as permanent
  });

  await cognitoIdentityProviderClient.send(adminChangePasswordCommand);
};

export const createUser = async ({
  userPoolId,
  email,
  givenName,
  familyName,
  subscriptionStatus,
  userRole,
}: {
  userPoolId: string;
  email: string;
  givenName: string;
  familyName: string;
  subscriptionStatus?: SubscriptionStatus;
  userRole?: UserTypeEnum;
}) => {
  if (!subscriptionStatus) {
    subscriptionStatus = SubscriptionStatus.FREE;
  }
  if (!userRole) {
    userRole = UserTypeEnum.USER;
  }

  const adminCreateUserCommand = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    MessageAction: "SUPPRESS", // don't send email to the user
    Username: email,
    UserAttributes: [
      {
        Name: "given_name",
        Value: givenName,
      },
      {
        Name: "family_name",
        Value: familyName,
      },
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "email_verified",
        Value: "true",
      },
      {
        Name: "custom:subscriptionStatus",
        Value: subscriptionStatus.toString(),
      },
      {
        Name: "custom:role",
        Value: userRole.toString(),
      },
    ],
  });

  try {
    const { User } = await cognitoIdentityProviderClient.send(
      adminCreateUserCommand,
    );

    await addUserToGroup(userPoolId, User?.Username!, "USERS");

    return User;
  } catch (error) {
    console.error("Error creating user: ", error);
    return;
  }
};

export const deleteUser = async ({
  userPoolId,
  userName,
}: {
  userPoolId: string;
  userName: string;
}) => {
  const adminDeleteUserCommand = new AdminDeleteUserCommand({
    UserPoolId: userPoolId,
    Username: userName,
  });

  await cognitoIdentityProviderClient.send(adminDeleteUserCommand);
};

export const linkSocialAccount = async ({
  userPoolId,
  cognitoUsername,
  providerName,
  providerUserId,
}: {
  userPoolId: string;
  cognitoUsername?: string;
  providerName: string;
  providerUserId: string;
}) => {
  const linkProviderForUserCommand = new AdminLinkProviderForUserCommand({
    UserPoolId: userPoolId,
    DestinationUser: {
      ProviderName: "Cognito", // Cognito is the default provider
      ProviderAttributeValue: cognitoUsername, // this is the username of the user
    },
    SourceUser: {
      ProviderName: providerName, // Google or Facebook (first letter capitalized)
      ProviderAttributeName: "Cognito_Subject", // Cognito_Subject is the default attribute name
      ProviderAttributeValue: providerUserId, // this is the value of the provider
    },
  });

  await cognitoIdentityProviderClient.send(linkProviderForUserCommand);
};

export const findUserByEmail = async (
  email: string,
  userPoolId: string,
): Promise<UserType | undefined> => {
  const listUsersCommand = new ListUsersCommand({
    UserPoolId: userPoolId,
    Filter: `email = "${email}"`,
    Limit: 1,
  });

  const { Users } = await cognitoIdentityProviderClient.send(listUsersCommand);

  return Users?.[0];
};

export const addUserToGroup = async (
  userPoolId: string,
  userName: string,
  groupName: string,
) => {
  // Add user to the appropriate group using the v3 SDK client
  const addToGroupCommand = new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: userName,
    GroupName: groupName,
  });

  await cognitoIdentityProviderClient.send(addToGroupCommand);
};

export const updateUserAttributes = async (
  userPoolId: string,
  userName: string,
  attr: any = {},
) => {
  const userAttributes = Object.keys(attr).map((key) => {
    return {
      Name: key,
      Value: attr[key],
    };
  });

  const adminUpdateUserAttributesCommand = new AdminUpdateUserAttributesCommand(
    {
      UserPoolId: userPoolId,
      Username: userName,
      UserAttributes: userAttributes,
    },
  );

  await cognitoIdentityProviderClient.send(adminUpdateUserAttributesCommand);
};

export const getGroupsForUser = async (
  userPoolId: string,
  userName: string,
): Promise<string[]> => {
  const command = new AdminListGroupsForUserCommand({
    UserPoolId: userPoolId,
    Username: userName,
  });

  const response = await cognitoIdentityProviderClient.send(command);

  // Extract group names
  const groups =
    response.Groups?.map((group) => group.GroupName).filter(
      (name): name is string => name !== undefined,
    ) || [];

  return groups;
};
