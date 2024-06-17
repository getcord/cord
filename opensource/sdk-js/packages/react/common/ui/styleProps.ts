import type { WithCSSVariableOverrides } from './cssVariables.js';
import type {
  BorderRadiusOverride,
  BorderRadiusProps,
} from './atomicClasses/borderRadius.js';
import type {
  ColorProps,
  ColorVariablesOverride,
} from './atomicClasses/colors.js';
import type {
  FontProps,
  FontVariablesOverride,
} from './atomicClasses/fonts.js';
import type { MarginAndPaddingProps } from './atomicClasses/marginPadding.js';
import type { PositionProps } from './atomicClasses/position.js';
import type { ShadowProps } from './atomicClasses/shadows.js';
import type { SizeProps, SizeVariablesOverride } from './atomicClasses/size.js';
import type { UtilityProps } from './atomicClasses/utility.js';

export type AllStyleProps = BorderRadiusProps &
  ColorProps &
  FontProps &
  ShadowProps &
  SizeProps &
  UtilityProps &
  MarginAndPaddingProps &
  PositionProps;

export type AllStyleCSSOverrides = FontVariablesOverride &
  ColorVariablesOverride &
  SizeVariablesOverride &
  BorderRadiusOverride;

type StyleNames = {
  backgroundColor:
    | 'backgroundColor'
    | 'backgroundColorHover'
    | 'backgroundColorActive';
  borderColor: 'borderColor' | 'borderColorHover' | 'borderColorActive';
  borderRadius: 'borderRadius';
  center: 'center';
  color: 'color' | 'colorHover' | 'colorActive';
  ellipsis: 'ellipsis';
  font: 'font';
  insetZero: 'insetZero';
  marginPadding: keyof MarginAndPaddingProps;
  noWrap: 'noWrap';
  position: 'position';
  row: 'row';
  scrollable: 'scrollable';
  shadow: 'shadow';
  size: keyof SizeProps;
};

export type StyleProps<P extends keyof StyleNames = keyof StyleNames> =
  Partial<{
    [K in StyleNames[P]]: AllStyleProps[K];
  }>;

type HTMLTag = keyof JSX.IntrinsicElements;

// Include all regular props of element, replacing ref with forwardRef
export type ElementProps<Tag extends HTMLTag> = Omit<
  JSX.IntrinsicElements[Tag],
  'ref' | keyof AllStyleProps // Exclude any regular prop with same name as our style props
> & {
  forwardRef?: JSX.IntrinsicElements[Tag]['ref'];
};

/**
 * UI props includes:
 * - Default props for the specified HTML tag, with forwardRef instead of ref
 * - StyleProps specified by styleNames passed in second generic argument
 * - Any additional props specified by (optional) third generic argument
 */
export type UIProps<
  Tag extends HTMLTag,
  StyleProp extends keyof StyleNames,
  AdditionalProps = unknown,
> = WithCSSVariableOverrides<
  ElementProps<Tag> & StyleProps<StyleProp> & AdditionalProps,
  AllStyleCSSOverrides
>;

type StyleProp = keyof AllStyleProps | 'cssVariablesOverride';

// This is just here to check we've included all style props
// Probably a better way to do this
const stylePropsObj: { [styleProp in StyleProp]: true } = {
  backgroundColor: true,
  backgroundColorActive: true,
  backgroundColorHover: true,
  borderColor: true,
  borderColorActive: true,
  borderColorHover: true,
  borderRadius: true,
  center: true,
  color: true,
  colorActive: true,
  colorHover: true,
  ellipsis: true,
  font: true,
  height: true,
  insetZero: true,
  margin: true,
  marginBottom: true,
  marginHorizontal: true,
  marginLeft: true,
  marginRight: true,
  marginTop: true,
  marginVertical: true,
  noWrap: true,
  padding: true,
  paddingBottom: true,
  paddingHorizontal: true,
  paddingLeft: true,
  paddingRight: true,
  paddingTop: true,
  paddingVertical: true,
  position: true,
  row: true,
  scrollable: true,
  shadow: true,
  width: true,
  cssVariablesOverride: true,
};

const isStyleProp = (propName: string): propName is StyleProp => {
  return propName in stylePropsObj;
};

export function stripStyleProps<
  P extends AllStyleProps & { cssVariablesOverride?: any },
>(props: P) {
  const newProps = { ...props };
  const styleProps: {
    [styleProp in StyleProp]?: any;
  } = {};
  for (const prop of Object.keys(newProps)) {
    if (isStyleProp(prop)) {
      styleProps[prop] = newProps[prop];
      delete newProps[prop];
    }
  }
  return { styleProps, propsExStyleProps: newProps as Omit<P, StyleProp> };
}
