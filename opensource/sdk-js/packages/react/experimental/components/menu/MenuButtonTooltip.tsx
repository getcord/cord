import * as React from 'react';
import { forwardRef } from 'react';
import withCord from '../hoc/withCord.js';
import type { StyleProps } from '../../types.js';
import { DefaultTooltip } from '../WithTooltip.js';

export type MenuButtonTooltipProps = { label: string } & StyleProps;
export const MenuButtonTooltip = withCord<
  React.PropsWithChildren<MenuButtonTooltipProps>
>(
  forwardRef(function OptionsMenuTooltip(
    { label, ...rest }: MenuButtonTooltipProps,
    _ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return <DefaultTooltip {...rest} label={label} />;
  }),
  'OptionsMenuTooltip',
);
