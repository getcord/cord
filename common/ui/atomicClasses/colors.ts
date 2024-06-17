import type {
  CSSVariable,
  ColorVar,
  WithCSSVariableOverrides,
} from 'common/ui/cssVariables.ts';
import {
  cssValueWithOverride,
  cssVar,
  cssVarWithOverride,
} from 'common/ui/cssVariables.ts';
import type { Styles } from 'common/ui/types.ts';

type ColorProp = 'backgroundColor' | 'borderColor' | 'color';
type HoverColorProp = `${ColorProp}Hover`;
type ActiveColorProp = `${ColorProp}Active`;

type ColorProperty = ColorProp | HoverColorProp | ActiveColorProp;

export type ColorProps = {
  [colorProperty in ColorProperty]?: ColorVar;
};

export type ColorVariablesOverride = {
  [colorProperty in Exclude<
    ColorProperty,
    'borderColor' | 'borderColorHover' | 'borderColorActive'
  >]?: CSSVariable;
} & {
  // for overriding border we allow changing all border props:
  // width style color (e.g. 1px solid black)
  // so we drop "Color" from the name of the override
  border?: CSSVariable;
  borderActive?: CSSVariable;
  borderHover?: CSSVariable;
};

export const getColorStyles = (
  props: WithCSSVariableOverrides<ColorProps, ColorVariablesOverride>,
): Styles => ({
  color: cssVarWithOverride(
    props.color ? `color-${props.color}` : undefined,
    props.cssVariablesOverride?.color,
  ),
  backgroundColor: cssVarWithOverride(
    props.backgroundColor ? `color-${props.backgroundColor}` : undefined,
    props.cssVariablesOverride?.backgroundColor,
  ),
  border: cssValueWithOverride(
    props.borderColor
      ? `1px solid ${cssVar(`color-${props.borderColor}`)}`
      : undefined,
    props.cssVariablesOverride?.border,
  ),

  '&:hover': {
    color: cssVarWithOverride(
      props.colorHover ? `color-${props.colorHover}` : undefined,
      props.cssVariablesOverride?.colorHover,
    ),
    backgroundColor: cssVarWithOverride(
      props.backgroundColorHover
        ? `color-${props.backgroundColorHover}`
        : undefined,
      props.cssVariablesOverride?.backgroundColorHover,
    ),
    border: cssValueWithOverride(
      props.borderColorHover
        ? `1px solid ${cssVar(`color-${props.borderColorHover}`)}`
        : undefined,
      props.cssVariablesOverride?.borderHover,
    ),
  },

  '&:active': {
    color: cssVarWithOverride(
      props.colorActive ? `color-${props.colorActive}` : undefined,
      props.cssVariablesOverride?.colorActive,
    ),
    backgroundColor: cssVarWithOverride(
      props.backgroundColorActive
        ? `color-${props.backgroundColorActive}`
        : undefined,
      props.cssVariablesOverride?.backgroundColorActive,
    ),
    border: cssValueWithOverride(
      props.borderColorActive
        ? `1px solid ${cssVar(`color-${props.borderColorActive}`)}`
        : undefined,
      props.cssVariablesOverride?.borderActive,
    ),
  },
});
