import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Point to your AppSync schema file
  schema: 'graphql/schema.graphql',

  // Define where the output file should be created
  generates: {
    'src/lambda/graphql-types.ts': {
      // This path should point to where your lambdas can import it from
      plugins: [
        'typescript', // Generates core types (inputs, objects, enums)
        'typescript-operations', // Generates types for your queries and mutations
      ],
      config: {
        // Use this to map your GraphQL scalars to TypeScript types
        scalars: {
          AWSDateTime: 'string',
          AWSDate: 'string',
          AWSURL: 'string',
          AWSEmail: 'string',
          AWSJSON: '{ [key: string]: any }',
        },
        // Helps avoid name conflicts
        namingConvention: {
          enumValues: 'keep', // Keeps your enum values as they are (e.g., PENDING)
        },
      },
    },
  },
};

export default config;
