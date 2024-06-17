import type {
  BorderRadiusVar,
  CSSVariable,
  WithCSSVariableOverrides,
} from '../cssVariables.js';
import { cssVarWithOverride } from '../cssVariables.js';
import type { Styles } from './types.js';

export type BorderRadiusProps = {
  borderRadius?: BorderRadiusVar;
};

export type BorderRadiusOverride = Partial<{
  borderRadius: CSSVariable;
}>;

export const getBorderRadiusStyles = (
  props: WithCSSVariableOverrides<BorderRadiusProps, BorderRadiusOverride>,
): Styles => ({
  borderRadius: cssVarWithOverride(
    props.borderRadius ? `border-radius-${props.borderRadius}` : undefined,
    props.cssVariablesOverride?.borderRadius,
  ),
});
