// All of this is as tiny fragment of the AJV schema.
// I'm not really sure where to call it "done". We use
// a fairly compact subset of AJV at the time I'm writing
// this comment, but that's entirely subject to change
// over time.
//
// One bummer about using the AJV definitions is that it
// leaves out things like default values, which we have
// in the docs currently.
export type Property = {
  readonly type: string | readonly string[];
  readonly description?: string | JSX.Element;
  readonly items?: Property | Ref | AnyOf;
  readonly properties?: PropertiesList['properties'];
  readonly propertyOrder?: PropertiesList['propertyOrder'];
  readonly required?: PropertiesList['required'];
  readonly format?: string;
  readonly enum?: readonly (string | number)[];
};

export type AnyOf = {
  readonly description?: string;
  readonly anyOf: readonly Property[];
};

export type Ref = {
  readonly ['$ref']: string;
  readonly description?: string | JSX.Element;
};

export type PropertiesList = {
  readonly propertyOrder: readonly string[];
  readonly required?: readonly string[];
  readonly properties: {
    readonly [propName: string]: AnyOf | Property | Ref;
  };
  readonly definitions?: {
    readonly [defName: string]: Property;
  };
};

export type PropertiesDictionary = {
  [displayName: string]: PropertiesList;
};

export type SingleMethod = {
  overloaded?: false;
  name: string;
  summary: string;
  examples: Record<string, string>;
  parameters: PropertiesList;
  returns: AnyOf | Property;
};

export type OverloadedMethod = {
  overloaded: true;
  overloads: SingleMethod[];
};

export type Method = SingleMethod | OverloadedMethod;

export type Interface = {
  name: string;
  methods: {
    methodOrder: readonly string[];
    required: readonly string[];
    methods: Record<string, Method>;
  };
  properties: PropertiesList;
};
