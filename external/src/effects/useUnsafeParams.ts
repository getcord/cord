import { useParams } from 'react-router-dom';

/**
 * Does exactly the same as `useParams` from `react-router-dom`.
 * But, in order to mimic the behavior we had in v5,
 *  it changes the return type so that TS believes any parameters your are asking for does exist.
 *
 * Suppose we are asking for `const {id} = useUnsafeParams<{id: string}>();`
 * The type of `id` will be `string`, but with `useSafeParams` (v6), it will be `string | undefined`.
 *
 * Indeed, TS cannot guarantee we are calling at a location that include a `:id` param, so assuming it exists is unsafe.
 *
 *
 **/
export function useUnsafeParams<
  T extends string | Record<string, string | undefined> = string,
>() {
  return useParams<T>() as Required<T>;
}
