import { useRef } from 'react';
import cx from 'classnames';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';

import type {
  AllStyleCSSOverrides,
  AllStyleProps,
} from '@cord-sdk/react/common/ui/styleProps.ts';
import { stripStyleProps } from '@cord-sdk/react/common/ui/styleProps.ts';
import { getBorderRadiusStyles } from '@cord-sdk/react/common/ui/atomicClasses/borderRadius.ts';
import { getColorStyles } from '@cord-sdk/react/common/ui/atomicClasses/colors.ts';
import { getFontStyles } from 'common/ui/fonts.ts';
import { getMarginPaddingStyles } from '@cord-sdk/react/common/ui/atomicClasses/marginPadding.ts';
import { getShadowStyles } from '@cord-sdk/react/common/ui/atomicClasses/shadows.ts';
import { getUtilityStyles } from '@cord-sdk/react/common/ui/atomicClasses/utility.ts';
import { getSizeStyles } from '@cord-sdk/react/common/ui/atomicClasses/size.ts';
import { getPositionStyles } from '@cord-sdk/react/common/ui/atomicClasses/position.ts';
import type { WithCSSVariableOverrides } from 'common/ui/cssVariables.ts';
import type { Styles } from 'common/ui/types.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { InjectDynamicStylesContext } from 'external/src/common/JssInjector.tsx';

type Props<OtherProps> = WithCSSVariableOverrides<
  AllStyleProps & {
    className?: string;
    forwardRef?: any;
  } & OtherProps,
  AllStyleCSSOverrides
>;

export function useStyleProps<OtherProps extends object>(
  props: Props<OtherProps>,
  refName: 'ref' | 'forwardRef' = 'ref',
): OtherProps & { className: string | undefined } {
  const { styleProps, propsExStyleProps } = stripStyleProps(props);

  // Only recreate styles when style props have changed
  const prevStyleProps = useRef<null | AllStyleProps>(null);
  const dynamicClass = useRef<string | null>(null);
  const injectDynamicStyles = useContextThrowingIfNoProvider(
    InjectDynamicStylesContext,
  );
  if (!injectDynamicStyles) {
    // this should never happen, appease linter
    // TODO: Delete this if-block once useContextThrowingIfNoProvider() throws
    // when provider is missing
    throw 'injectDynamicStyles was null';
  }

  // use isEqual instead of useMemo for deep comparison
  if (!isEqual(styleProps, prevStyleProps.current)) {
    prevStyleProps.current = styleProps;
    const styles = {
      ...getBorderRadiusStyles(styleProps),
      ...getColorStyles(styleProps),
      ...getFontStyles(styleProps),
      ...getMarginPaddingStyles(styleProps),
      ...getPositionStyles(styleProps),
      ...getShadowStyles(styleProps),
      ...getSizeStyles(styleProps),
      ...getUtilityStyles(styleProps),
    } as Styles;
    dynamicClass.current = injectDynamicStyles(styles);
  }

  const { className, forwardRef, ...otherProps } = propsExStyleProps;
  const combinedClassName = cx(dynamicClass.current, className);

  return {
    ...(otherProps as OtherProps),
    [refName]: forwardRef,
    className: combinedClassName || undefined,
  };
}
