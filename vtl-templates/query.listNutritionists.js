export function request(ctx) {
  // Query nutritionist profiles from GSI1 index
  const limit = ctx.args.limit || 20;
  const nextToken = ctx.args.nextToken;
  const filter = ctx.args.filter || {};

  let query = {
    operation: 'Query',
    index: 'GSI1_NutritionistListings',
    query: {
      expression: 'GSI1PK = :pk',
      expressionValues: {
        ':pk': { S: 'NUTR_PROFILES_ALL' },
      },
    },
    limit: limit,
    scanIndexForward: true, // Sort by GSI1SK (name) in ascending order
  };

  // Add filter for availability if specified
  if (filter.isAvailable !== undefined) {
    query.query.expression += ' AND IsAvailable = :isAvailable';
    query.query.expressionValues[':isAvailable'] = { BOOL: filter.isAvailable };
  }

  // Add pagination token if provided
  if (nextToken) {
    query.nextToken = nextToken;
  }

  return query;
}

export function response(ctx) {
  const items = ctx.result && ctx.result.items ? ctx.result.items : [];
  const nextToken =
    ctx.result && ctx.result.nextToken ? ctx.result.nextToken : null;

  // Transform DynamoDB items to match NutritionistProfile type
  const transformedItems = items.map((item) => ({
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
  }));

  return {
    items: transformedItems,
    nextToken: nextToken,
  };
}
