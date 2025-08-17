import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const sub = ctx.identity?.sub;
  if (!sub) {
    util.unauthorized();
  }

  const pk = `USER#${sub}`;
  const sk = 'USER_DETAILS';

  const input = ctx.args.input;
  const now = util.time.nowISO8601();

  const sets = ['#updatedAt = :updatedAt'];
  const removes = [];
  const expressionNames = { '#updatedAt': 'updatedAt' };
  const rawValues = { ':updatedAt': now };

  for (const [key, value] of Object.entries(input)) {
    const isEmptyString = typeof value === 'string' && value.trim() === '';
    const isEmptyArray =
      key === 'allergies' && Array.isArray(value) && value.length === 0;
    const shouldRemove = value === null || isEmptyString || isEmptyArray;

    expressionNames[`#${key}`] = key;

    if (shouldRemove) {
      removes.push(`#${key}`);
    } else {
      sets.push(`#${key} = :${key}`);
      rawValues[`:${key}`] = value;
    }
  }

  let expression = '';
  if (sets.length > 0) expression += 'SET ' + sets.join(', ');
  if (removes.length > 0) expression += ' REMOVE ' + removes.join(', ');

  return {
    operation: 'UpdateItem',
    key: {
      PK: { S: pk },
      SK: { S: sk },
    },
    update: {
      expression,
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(rawValues),
    },
  };
}

/**
 * Returns the resolver result
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the result
 */
export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type, ctx.result);
  }

  return {
    updateSucceeded: true,
    userId: ctx.identity?.sub ?? null,
  };
}
