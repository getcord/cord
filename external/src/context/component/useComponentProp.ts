import { ComponentContext } from 'external/src/context/component/ComponentContext.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useComponentProp<T>(propName: string, defaultValue: T) {
  const props = useContextThrowingIfNoProvider(ComponentContext)?.props;
  return props && propName in props ? (props[propName] as T) : defaultValue;
}
