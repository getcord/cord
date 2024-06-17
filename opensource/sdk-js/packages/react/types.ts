import type * as React from 'react';
import type { Location } from '@cord-sdk/types';
import type { Placement } from '@floating-ui/react-dom';

export type ReactPropsWithStandardHTMLAttributes<T> = T & {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
};

export type ReactPropsWithLocation<T> = T & {
  /**
   * @deprecated The context prop has been renamed to location.
   */
  context?: Location;
  location?: Location;
};

export type PresenceReducerOptions = ReactPropsWithLocation<{
  excludeViewer?: boolean;
  onlyPresentUsers?: boolean;
  /**
   * @deprecated The exactMatch prop has been replaced by partialMatch.
   */
  exactMatch?: boolean;
  partialMatch?: boolean;
}>;

export type PropsWithRef<T> = T & {
  forwardRef?: React.MutableRefObject<Element | null>;
};

export type PropsWithFlags<T> = T &
  Partial<{
    useShadowRoot: boolean;
  }>;

export type PopperPosition = Placement;
