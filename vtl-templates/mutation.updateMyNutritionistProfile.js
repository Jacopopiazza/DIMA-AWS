export function request(ctx) {
  const {
    givenName,
    familyName,
    specialization,
    bio,
    profilePictureUrl,
    isAvailable,
  } = ctx.args.input;
  const userId = ctx.identity.sub;
  const now = util.time.nowISO8601();

  // Prepare the item data for create/update
  const itemData = {
    PK: `NUTR#${userId}`,
    SK: "NUTR_DETAILS",
    NutritionistID: userId,
    GivenName: givenName,
    FamilyName: familyName,
    Specialization: specialization,
    Bio: bio,
    ProfilePictureURL: profilePictureUrl,
    IsAvailable: isAvailable,
    CreatedAt: now,
    UpdatedAt: now,
    // GSI1 keys for listing
    GSI1PK: "NUTR_PROFILES_ALL",
    GSI1SK: `NUTRID#${userId}`,
  };

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `NUTR#${userId}`,
      SK: "NUTR_DETAILS",
    }),
    attributeValues: util.dynamodb.toMapValues(itemData),
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
      item.ProfilePictureURL && item.ProfilePictureURL.trim() !== ""
        ? item.ProfilePictureURL
        : null,
    isAvailable: item.IsAvailable,
  };
}
