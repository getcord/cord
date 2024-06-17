import { useRef } from 'react';

export const useUpdatingRef = <V>(value: V) => {
  const valueRef = useRef(value);
  valueRef.current = value;

  return valueRef;
};
