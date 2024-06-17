// There is some TypeScript trickery in this file. It is optimised for making
// the use of `magicEnv` look good. The call to `magicEnv` should look readable
// and self-explanatory, and the type hints displayed by the IDE should be
// useful.

// Define types to declare variables as required, optional or having a default
// value.  If these classes were empty, TypeScript would treat them as
// interchangeable. By giving them different shapes (i.e. different members),
// TypeScript will keep them apart.
class RequiredVariable {
  public readonly req = true;
}
class OptionalVariable {
  public readonly opt = true;
}
class VariableWithDefaultValue {
  constructor(public readonly defaultValue: string) {}
}

// These are the helpers that are used by the caller of `magicEnv` to define
// their environment fields.
export const required = new RequiredVariable();
export const optional = new OptionalVariable();
// eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
export const defaultValue = (defaultValue: string) =>
  new VariableWithDefaultValue(defaultValue);

// Here comes the main function of this module: `magicEnv`. It takes one
// parameter: a JavaScript object with string keys and values of type
// RequiredVariable, OptionalVariable or VariableWithDefaultValue.
//
// `magicEnv` is a template function, which is quite important.
// `EnvDefinitionType` is the specific type of the environment definition.
// That type must comply with the restriction that it is an object with string
// keys and those variable types as values.  However, we will need the
// *specific* type, i.e. a TypeScript type that contains the specific keys with
// the corresponding value types. We get access to this type by templating this
// function.
export function magicEnv<
  EnvDefinitionType extends {
    [key: string]:
      | RequiredVariable
      | OptionalVariable
      | VariableWithDefaultValue;
  },
>(
  processEnv: { [key: string]: string | undefined },
  envDefinition: EnvDefinitionType,
) {
  // Now start constructing the result of this function.
  const env: Partial<{ [k in keyof EnvDefinitionType]: string }> = {};

  // And now we iterate through the `envDefinition` object, which we received
  // from the callback function.
  for (const key of Object.keys(envDefinition) as (string &
    keyof EnvDefinitionType)[]) {
    // This is the value from the process environment
    const value: string | undefined = processEnv[key];

    // This is the value from the definition object at the top
    const fieldDefinition:
      | RequiredVariable
      | OptionalVariable
      | VariableWithDefaultValue = envDefinition[key];

    if ((fieldDefinition as any).req) {
      // This is a required variable.

      if (value === undefined) {
        throw new Error(`Missing key ${key} in environment`);
      } else {
        env[key] = value;
      }
    } else if ((fieldDefinition as any).opt) {
      // This is an optional variable. `value` may be a string or undefined.

      env[key] = value;
    } else {
      // This is a variable with a default value (the value of
      // `fieldDefinition`)

      if (value === undefined) {
        env[key] = (fieldDefinition as VariableWithDefaultValue).defaultValue;
      } else {
        env[key] = value;
      }
    }
  }

  // Return the `env` object that we have just constructed, but return with a
  // special type that we define here: it is an object which contains all the
  // keys that the definition object has. The value type is `string`, except
  // for fields that correspond to optional variables, those have type
  // `string | undefined`. All fields are declared readonly.
  return env as {
    readonly [k in keyof EnvDefinitionType]: EnvDefinitionType[k] extends OptionalVariable
      ? string | undefined
      : string;
  };
}
