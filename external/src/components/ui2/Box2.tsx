import * as React from 'react';

import { useStyleProps } from 'external/src/components/ui2/useStyleProps.ts';
import type { UIProps } from 'common/ui/styleProps.ts';

export type Box2Props = UIProps<
  'div',
  | 'backgroundColor'
  | 'borderColor'
  | 'borderRadius'
  | 'center'
  | 'font'
  | 'insetZero'
  | 'marginPadding'
  | 'position'
  | 'row'
  | 'scrollable'
  | 'shadow'
  | 'size'
>;

/**
 * @deprecated Use a `div` instead
 */
export const Box2 = React.memo(function Box2(
  props: React.PropsWithChildren<Box2Props>,
) {
  const { children, ...otherProps } = useStyleProps(props);
  return <div {...otherProps}>{children}</div>;
});
