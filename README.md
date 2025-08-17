# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

## Available Scripts

This project provides several NPM scripts to streamline development tasks:

- **`build`**:  
  Runs both the formatting and TypeScript compilation. It formats the code using Prettier and then compiles the TypeScript files using `tsc`.

  ```bash
  npm run build
  ```

- **`tsc`**:  
  Compiles the TypeScript files using the TypeScript compiler.

  ```bash
  npm run tsc
  ```

- **`format`**:  
  Formats the code using [Prettier](https://prettier.io/) to ensure consistent styling.

  ```bash
  npm run format
  ```

- **`check`**:  
  Checks if the code is formatted according to the Prettier rules without modifying any files.

  ```bash
  npm run check
  ```

- **`test`**:  
  Runs the tests using [Jest](https://jestjs.io/), a JavaScript testing framework.

  ```bash
  npm run test
  ```

- **`cdk`**:  
  Runs the AWS CDK CLI for managing your infrastructure as code.

  ```bash
  npm run cdk
  ```

- **`deploy`**:  
  Deploys your AWS CDK stack using `cdk deploy`.

  ```bash
  npm run deploy
  ```

- **`watch`**:  
  Watches for changes and automatically updates your CDK stack.
  ```bash
  npm run watch
  ```
- **`diff`**  
  Compares the deployed stack with the current state.

  ```bash
  npm run diff
  ```

- **`synth`**  
  Emits the synthesized CloudFormation template.

  ```bash
  npm run synth
  ```

- **`codegen`**  
  Generates ts classes for lambdas from GraphQL Schema
  ```bash
  npm run codegen
  ```
