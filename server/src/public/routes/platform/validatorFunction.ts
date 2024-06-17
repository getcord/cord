import Ajv from 'ajv';
import type { ErrorObject, DefinedError, AnySchema } from 'ajv';
import { fullFormats } from 'ajv-formats/dist/formats.js';
import addFormat from 'ajv-formats';
import { schema } from '@cord-sdk/api-types';
import type {
  ClientAuthTokenData,
  Types,
  UpdatePlatformUserVariables,
} from '@cord-sdk/api-types';

import type { PlatformErrorNameType } from 'server/src/public/routes/platform/util.ts';
import { ApiCallerError } from 'server/src/public/routes/platform/util.ts';

type TypeKey = keyof Types;

const ajv = new Ajv.default({
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  allowUnionTypes: true,
  keywords: ['propertyOrder'], // as propertyOrder is not a default key in json schemas and so crashes as we're running on strict mode
  verbose: true, // Include the reference to the part of the schema (schema and parentSchema) and validated data in errors
});

addFormat.default(ajv, ['date-time', 'uri', 'uuid']);

// This overrides the email format in ajv to also accept empty strings
ajv.addFormat('email', {
  validate: (data: any) => {
    if (data === '') {
      return true;
    }
    return data.match(fullFormats['email']);
  },
});

type InputWithFields = {
  [instancePath: string]: { input: string | null; fields: string[] };
};

function getErrorMessage(typeName: TypeKey, errors: ErrorObject[]) {
  const errorMessages: string[] = [];
  const requiredFieldErrors: InputWithFields = {};
  const additionalFieldErrors: InputWithFields = {};
  // DefinedError is a type for all pre-defined keywords errors
  // as we have no user defined keywords we can use DefinedErrors
  for (const error of errors as DefinedError[]) {
    const field = error.instancePath.slice(1); // removing the forward slash if instance path exists
    const schemaPath = error.schemaPath;

    // We don't want to go through each case of the anyOf
    if (schemaPath.includes('anyOf') && error.keyword !== 'anyOf') {
      continue;
    }

    const errorData = JSON.stringify(error.data);
    // to add more error types https://ajv.js.org/api.html#error-parameters
    switch (error.keyword) {
      case 'required': {
        const instancePath = error.instancePath;
        if (!requiredFieldErrors[instancePath]) {
          requiredFieldErrors[instancePath] = { input: null, fields: [] };
          requiredFieldErrors[instancePath]['input'] = errorData;
        }
        requiredFieldErrors[instancePath]['fields'].push(
          error.params.missingProperty,
        );
        break;
      }
      case 'type': {
        let params: string;
        if (Array.isArray(error.params.type)) {
          params = error.params.type.join(' or ');
        } else {
          params = error.params.type;
        }
        errorMessages.push(
          `Input ${errorData} for ${field} must be type ${params}`,
        );
        break;
      }
      case 'format':
      case 'minLength':
      case 'maxLength':
        errorMessages.push(`Input ${errorData} for ${field} ${error.message}`);
        break;
      case 'additionalProperties': {
        const instancePath = error.instancePath;
        if (!additionalFieldErrors[instancePath]) {
          additionalFieldErrors[instancePath] = { input: null, fields: [] };
          additionalFieldErrors[instancePath]['input'] = errorData;
        }
        additionalFieldErrors[instancePath]['fields'].push(
          error.params.additionalProperty,
        );
        break;
      }
      case 'enum':
        errorMessages.push(
          `Input ${errorData} for ${field} ${
            error.message
          }: ${error.params.allowedValues.join(' or ')}`,
        );
        break;
      case 'anyOf':
        errorMessages.push(
          `Input ${errorData} for ${field} must match one of: ${decodeSchema(
            error.schema,
          )}`,
        );
        break;
      case 'maxItems': {
        if (Array.isArray(error.data)) {
          errorMessages.push(
            `Input has ${error.data.length} items and ${error.message}`,
          );
        } else {
          errorMessages.push(`${field} ${error.message}`);
        }
        break;
      }
      default:
        errorMessages.push(`Input ${errorData} for ${field} ${error.message}`);
        break;
    }
  }
  // We compile messages with list of fields that are required
  Object.values(requiredFieldErrors).forEach((requiredFieldError) => {
    const errorMessage = generateFieldsMessageWithInput(
      requiredFieldError,
      'required',
    );

    if (errorMessage) {
      errorMessages.push(errorMessage);
    }
  });

  // We compile messages with a list of fields that are invalid
  Object.values(additionalFieldErrors).map((additionalFieldError) => {
    const errorMessage = generateFieldsMessageWithInput(
      additionalFieldError,
      'unexpected',
    );

    if (errorMessage) {
      errorMessages.push(errorMessage);
    }
  });

  const schemaDescription = getSchemaDescription(typeName);

  return `Invalid ${typeName}:\n${errorMessages.join(',\n')}.${
    schemaDescription ?? ''
  }`;
}

export const validate = Object.fromEntries(
  (Object.keys(schema) as TypeKey[]).map((typeName) => {
    const typeSchema = schema[typeName];
    const validator = ajv.compile<Types[TypeKey]>(typeSchema);

    const isClientAuthTokenData = typeName === 'ClientAuthTokenData';

    const errorName: PlatformErrorNameType = isClientAuthTokenData
      ? 'invalid_session_token'
      : 'invalid_request';

    const code = isClientAuthTokenData ? 401 : 400;

    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    function validate(value: any) {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
      const schemaDescription = getSchemaDescription(typeName);
      const isObject =
        value && typeof value === 'object' && !Array.isArray(value);
      if (!isObject) {
        throw new ApiCallerError(errorName, {
          message:
            `Invalid ${typeName}:\n` +
            'Expected JSON object.' +
            `${schemaDescription ?? ''}`,
          code,
        });
      }

      if (validator(value)) {
        return value;
      }

      if (validator.errors && validator.errors.length) {
        const message = getErrorMessage(typeName, validator.errors);
        throw new ApiCallerError(errorName, {
          message,
          code,
        });
      } else {
        // When `valid` is false, `validator.errors` should always contain one or more
        // errors. If not, we still need to throw *some* error.
        throw new ApiCallerError('invalid_request', {
          message: 'Invalid request',
        });
      }
    }

    return [typeName, validate] as const;
  }),
) as { [T in TypeKey]: (value: unknown) => Types[T] };

export function getSchemaDescription(typeName: TypeKey) {
  const schemaByType = schema[typeName];
  if (!('description' in schemaByType)) {
    return null;
  }

  if (typeof schemaByType.description !== 'string') {
    return null;
  }

  return `\nRefer to ${schemaByType.description}`;
}

function generateFieldsMessageWithInput(
  data: InputWithFields[keyof InputWithFields],
  type: 'required' | 'unexpected',
) {
  if (!data.input) {
    return null;
  }

  if (data.fields.length === 0) {
    return null;
  }

  if (type === 'unexpected') {
    return `Input ${data.input} has unexpected ${generateFieldsListToString(
      data.fields,
    )}`;
  }
  return `Input ${data.input} requires ${generateFieldsListToString(
    data.fields,
  )}`;
}

function generateFieldsListToString(fields: string[]) {
  let fieldsString = '';
  if (fields.length === 0) {
    return '';
  }
  if (fields.length === 1) {
    fieldsString = `field: ${fields[0]}`;
  }
  if (fields.length > 1) {
    fieldsString = `fields: ${fields.slice(0, -1).join(', ')} and ${fields
      .slice(-1)
      .join('')}`;
  }
  return fieldsString;
}

// eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
function decodeSchema(schema?: AnySchema[]) {
  const message: string[] = [];
  if (!schema) {
    return '';
  }

  schema?.map((schemaItem) => {
    if (typeof schemaItem !== 'boolean') {
      const item = schemaItem.format ?? schemaItem.type ?? '';
      message.push(item.toString());
    }
  });

  return message.join(', ');
}

type InputDataWithEmail = UpdatePlatformUserVariables | ClientAuthTokenData;

export function removeEmptyStringEmailIfExists<T extends InputDataWithEmail>(
  data: T,
): T | Exclude<T, 'email'> {
  const dataCopy = { ...data };
  if ('email' in dataCopy && dataCopy.email === '') {
    delete dataCopy.email;
    return dataCopy;
  }

  if (
    'user_details' in dataCopy &&
    dataCopy['user_details'] &&
    'email' in dataCopy.user_details &&
    dataCopy.user_details.email === ''
  ) {
    delete dataCopy.user_details.email;
    return dataCopy;
  }

  return data;
}
