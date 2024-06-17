import { useRef } from 'react';

/**
 * Hook to persist any arbitrary value in a useRef and automatically update
 * the current when the value changes. Useful for referencing changeable
 * values inside effects without bloating the deps array.
 */
export const useUpdatingRef = <V>(value: V) => {
  const valueRef = useRef(value);
  valueRef.current = value;
  return valueRef;
};
