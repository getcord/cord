// This function determines if X has property Y and does so in a
// a way that preserves the type information within TypeScript.
export function hasOwnProperty<Obj extends object, Prop extends PropertyKey>(
  obj: Obj,
  prop: Prop,
): obj is Obj & { [prop in Prop]: unknown } {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
