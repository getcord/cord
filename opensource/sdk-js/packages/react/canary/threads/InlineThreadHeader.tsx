import * as React from 'react';
import { forwardRef } from 'react';
import cx from 'classnames';

import type { ThreadSummary } from '@cord-sdk/types';
import withCord from '../../experimental/components/hoc/withCord.js';
import * as buttonClasses from '../../components/helpers/Button.classnames.js';
import { Icon } from '../../components/helpers/Icon.js';
import type { StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import * as fonts from '../../common/ui/atomicClasses/fonts.css.js';
import { Link } from '../../experimental/components/helpers/Link.js';
import type { CommonLinkProps } from '../../experimental/components/helpers/Link.js';
import classes from './Threads.css.js';

export type InlineThreadHeaderProps = {
  thread: ThreadSummary;
  hidden: boolean;
} & StyleProps &
  MandatoryReplaceableProps;

export const InlineThreadHeader = withCord<
  React.PropsWithChildren<InlineThreadHeaderProps>
>(
  forwardRef(function ThreadHeader(
    { className, thread, hidden, ...restProps }: InlineThreadHeaderProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    if (hidden) {
      return null;
    }

    const title = thread.name || thread.url;

    return (
      <div
        ref={ref}
        className={cx(className, classes.inlineThreadHeader)}
        {...restProps}
      >
        <InlineThreadHeaderTitle
          canBeReplaced
          href={thread.url}
          target="_blank"
        >
          {title}
        </InlineThreadHeaderTitle>
        <InlineThreadHeaderButton
          canBeReplaced
          href={thread.url}
          target="_blank"
        />
      </div>
    );
  }),
  'InlineThreadHeader',
);

export type InlineThreadHeaderTitleProps = CommonLinkProps &
  StyleProps &
  MandatoryReplaceableProps;

export const InlineThreadHeaderTitle = withCord<
  React.PropsWithChildren<InlineThreadHeaderTitleProps>
>(
  forwardRef(function InlineThreadHeaderTitle(
    { className, children, ...restProps }: InlineThreadHeaderTitleProps,
    ref: React.ForwardedRef<HTMLAnchorElement>,
  ) {
    return (
      <Link
        ref={ref}
        className={cx(
          className,
          fonts.fontSmall,
          classes.inlineThreadHeaderTitle,
        )}
        {...restProps}
      >
        {children}
      </Link>
    );
  }),
  'InlineThreadHeaderTitle',
);

export type InlineThreadHeaderButtonProps = CommonLinkProps &
  StyleProps &
  MandatoryReplaceableProps;

export const InlineThreadHeaderButton = withCord<
  React.PropsWithChildren<InlineThreadHeaderButtonProps>
>(
  forwardRef(function InlineThreadHeaderButton(
    { className, ...restProps }: InlineThreadHeaderButtonProps,
    ref: React.ForwardedRef<HTMLAnchorElement>,
  ) {
    return (
      <Link
        ref={ref}
        className={cx(
          className,
          classes.inlineThreadHeaderButton,
          buttonClasses.button,
          buttonClasses.colorsSecondary,
          buttonClasses.small,
        )}
        role="button"
        data-cord-button={'navigate-to-thread-url'}
        {...restProps}
      >
        <Icon name="ArrowSquareOut" />
      </Link>
    );
  }),
  'InlineThreadHeaderButton',
);
