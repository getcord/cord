import * as React from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import type { ClientUserData } from '@cord-sdk/types';
import withCord from '../../experimental/components/hoc/withCord.js';
import { fontBodyEmphasis } from '../../common/ui/atomicClasses/fonts.css.js';
import { authorName } from '../../components/Message.classnames.js';
import { useComposedRefs } from '../../common/lib/composeRefs.js';
import {
  DefaultTooltip,
  WithTooltip,
} from '../../experimental/components/WithTooltip.js';
import type { StyleProps } from '../../experimental/types.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';

export type UsernameProps = {
  userData?: ClientUserData | null;
} & StyleProps &
  MandatoryReplaceableProps;

export const Username = withCord<React.PropsWithChildren<UsernameProps>>(
  forwardRef(function Username(
    props: UsernameProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { userData, className, ...restProps } = props;

    const [hasOverFlow, setHasOverflow] = useState(false);

    const nameRef = useRef<HTMLDivElement>(null);
    const composedRefs = useComposedRefs(ref, nameRef);

    useEffect(() => {
      if (nameRef.current) {
        setHasOverflow(
          nameRef.current.scrollWidth > nameRef.current.clientWidth,
        );
      }
    }, [userData]);

    if (!userData) {
      return undefined;
    }

    return (
      <WithTooltip
        tooltip={<UsernameTooltip canBeReplaced label={userData.displayName} />}
        tooltipDisabled={!hasOverFlow}
      >
        <div
          className={cx(className, fontBodyEmphasis, authorName)}
          ref={composedRefs}
          {...restProps}
        >
          {userData.displayName}
        </div>
      </WithTooltip>
    );
  }),
  'Username',
);

export type UsernameTooltipProps = {
  label: string;
} & MandatoryReplaceableProps;

export const UsernameTooltip = withCord<
  React.PropsWithChildren<UsernameTooltipProps>
>(
  forwardRef(function UsernameTooltip(
    { label, ...restProps }: UsernameTooltipProps,
    _ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return <DefaultTooltip label={label} {...restProps} />;
  }),
  'UsernameTooltip',
);
