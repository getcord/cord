import { forwardRef } from 'react';

import type { StyleProps } from '../types.js';
import withReplacement from './hoc/withReplacement.js';
import type { MandatoryReplaceableProps } from './replacements.js';

export type ErrorFallbackProps = {
  error?: Error;
  errorInfo?: React.ErrorInfo;
} & StyleProps &
  MandatoryReplaceableProps;

// Because this is used in 'withCord', we only wrap it in 'withReplacement'
// This avoids circular dependencies.
export const ErrorFallback = withReplacement<
  React.PropsWithChildren<ErrorFallbackProps>
>(
  forwardRef(function ErrorFallback(
    _props: ErrorFallbackProps,
    _ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    return null;
  }),
  'ErrorFallback',
);
export default ErrorFallback;
