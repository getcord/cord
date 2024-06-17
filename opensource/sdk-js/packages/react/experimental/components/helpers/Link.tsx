import * as React from 'react';
import { forwardRef } from 'react';
import cx from 'classnames';
import classes from '../../../components/helpers/Link.css.js';
import type { StyleProps } from '../../../betaV2.js';

export type CommonLinkProps = {
  children?: React.ReactNode;
  href?: string;
  hreflang?: string;
  id?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  rel?: string;
  role?: React.AriaRole;
  target?: React.HTMLAttributeAnchorTarget;
  title?: string;
} & StyleProps;

export const Link = forwardRef(function Link(
  { children, className, ...restProps }: CommonLinkProps,
  ref: React.Ref<HTMLAnchorElement>,
) {
  return (
    <a ref={ref} className={cx(className, classes.anchor)} {...restProps}>
      {children}
    </a>
  );
});
