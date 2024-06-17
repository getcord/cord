import * as React from 'react';
import type { ElementName } from '@cord-sdk/components';
import type { HTMLCordElement } from '@cord-sdk/types';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type ComponentContextValue = {
  element: HTMLCordElement;
  name: ElementName;
  props: Record<string, unknown>;
};

export const ComponentContext = React.createContext<
  ComponentContextValue | null | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);
