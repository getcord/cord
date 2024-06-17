<img width="100%" src="https://docs.cord.com/static/images/cord-sdk-banner.svg"></img>

# [@cord-sdk/api-types](https://docs.cord.com/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/getcord/cord-sdk/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/@cord-sdk/api-types.svg)](https://www.npmjs.com/package/@cord-sdk/api-types)

This package contains TypeScript type definitions and JSON schema objects for the data types used by the Cord REST API.

## Installation

```shell
npm install @cord-sdk/api-types
```

## TypeScript Type Definitions

To use proper type definitions for the data structures send to and received from the Cord REST API, import them from this package, e.g.:

```typescript
import { PlatformUserVariables } from '@cord-sdk/api-types';
```

## Run-Time Validation

You can use the JSON schema shipped in this package to validate data structures send to or received from the Cord REST API at run-time.

For example, to do run-time validation using the [AJV package](https://www.npmjs.com/package/ajv) in TypeScript:

```
import Ajv from "ajv";
import { schema } from '@cord-sdk/api-types';
import type { PlatformUserVariables } from '@cord-sdk/api-types';

const ajv = new Ajv();

const validatePlatformUserVariables = ajv.compile<PlatformUserVariables>(schema['PlatformUserVariables']);
```

The `validatePlatformUserVariables` function takes data as an argument and returns a boolean indicating whether the given data conforms to the schema for `PlatformUserVariables`. The function is declared as a type guard, so if you use it as the conditional in an if statement, TypeScript understands that within the true-branch, the data is of type `PlatformUserVariables`.
