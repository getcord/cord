import type {
  BorderRadiusVar,
  CSSVariable,
  WithCSSVariableOverrides,
} from 'common/ui/cssVariables.ts';
import { cssVarWithOverride } from 'common/ui/cssVariables.ts';
import type { Styles } from 'common/ui/types.ts';

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
