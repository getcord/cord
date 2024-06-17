/** @jsxImportSource @emotion/react */
import { useCallback, useMemo, useState } from 'react';
import type { Interpolation, Theme } from '@emotion/react';
import type {
  ComponentDropdownMapType,
  ComponentDropdownType,
} from 'docs/server/routes/components/types.ts';
import {
  LiveDemoSelect,
  LiveDemoSelectsContainer,
} from 'docs/server/ui/liveDemoCard/LiveDemoSelect.tsx';

export function useLiveDemoSelect<
  T extends Record<string, string | number | boolean>,
  K extends keyof T,
>(initialState: ComponentDropdownMapType<T>) {
  const [componentOptions, setComponentOptions] = useState(initialState);

  const updateComponentValue = useCallback((propName: string, value: T[K]) => {
    setComponentOptions((prevComponentProps) => ({
      ...prevComponentProps,
      [propName]: { ...prevComponentProps[propName], value },
    }));
  }, []);

  /**
   * This goes into the live component
   */
  const interactiveProps = useMemo(
    () =>
      Object.entries<ComponentDropdownType<string | number | boolean>>(
        componentOptions,
      ).reduce(
        (props, [prop, data]) => ({
          ...props,
          [prop]: data.value,
        }),
        {},
      ),
    [componentOptions],
  );

  const componentSelects = useMemo(() => {
    const props = Object.entries(componentOptions).map(
      ([propName, propData], index) => {
        return (
          <LiveDemoSelect
            key={`${propName}-${index}`}
            propName={propName}
            updateValue={updateComponentValue}
            {...propData}
          />
        );
      },
    );
    return <LiveDemoSelectsContainer>{props}</LiveDemoSelectsContainer>;
  }, [componentOptions, updateComponentValue]);

  const liveDemoCssStyles: Interpolation<Theme> = {
    padding: '8px 0px 64px 0px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 64,
  };

  return {
    componentOptions,
    setComponentOptions,
    updateComponentValue,
    interactiveProps,
    componentSelects,
    liveDemoCssStyles,
  };
}
