export function request(ctx) {
  // Get the authenticated user's ID
  const userId = ctx.identity.sub;

  return {
    operation: 'GetItem',
    key: util.dynamodb.toMapValues({
      PK: `NUTR#${userId}`,
      SK: 'NUTR_DETAILS',
    }),
  };
}

export function response(ctx) {
  const item = ctx.result;

  if (!item) {
    return null;
  }

  // Transform DynamoDB item to match NutritionistProfile type
  return {
    id: item.NutritionistID, // Add id for codegen compatibility
    nutritionistId: item.NutritionistID,
    givenName: item.GivenName,
    familyName: item.FamilyName,
    specialization: item.Specialization,
    bio: item.Bio,
    profilePictureUrl:
      item.ProfilePictureURL && item.ProfilePictureURL.trim() !== ''
        ? item.ProfilePictureURL
        : null,
    isAvailable: item.IsAvailable,
  };
}
