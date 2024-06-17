import type {
  CSSVariable,
  SpaceVar,
  WithCSSVariableOverrides,
} from 'common/ui/cssVariables.ts';
import { cssValueWithOverride, cssVar } from 'common/ui/cssVariables.ts';
import type { Styles } from 'common/ui/types.ts';

type MarginProps = {
  margin?: SpaceVar;
  marginTop?: SpaceVar;
  marginBottom?: SpaceVar;
  marginVertical?: SpaceVar;
  marginLeft?: SpaceVar;
  marginRight?: SpaceVar;
  marginHorizontal?: SpaceVar;
};

type PaddingProps = {
  padding?: SpaceVar;
  paddingTop?: SpaceVar;
  paddingBottom?: SpaceVar;
  paddingVertical?: SpaceVar;
  paddingLeft?: SpaceVar;
  paddingRight?: SpaceVar;
  paddingHorizontal?: SpaceVar;
};

export type MarginAndPaddingProps = MarginProps & PaddingProps;

export type MarginPaddingVariablesOverride = {
  padding: CSSVariable;
  margin: CSSVariable;
};

function spaceValuesWithFallback(
  spaceValues: Array<SpaceVar | undefined>,
  fallback: string,
) {
  if (spaceValues.every((space) => space === undefined)) {
    return undefined;
  }

  return spaceValues.map((space) =>
    space ? cssVar(`space-${space}`) : fallback,
  );
}

type NewType = WithCSSVariableOverrides<
  MarginAndPaddingProps,
  MarginPaddingVariablesOverride
>;

export const getMarginPaddingStyles = (props: NewType): Styles => ({
  margin: cssValueWithOverride(
    spaceValuesWithFallback(
      [
        props.marginTop ?? props.marginVertical ?? props.margin,
        props.marginRight ?? props.marginHorizontal ?? props.margin,
        props.marginBottom ?? props.marginVertical ?? props.margin,
        props.marginLeft ?? props.marginHorizontal ?? props.margin,
      ],
      '0',
    )?.join(' '),
    props.cssVariablesOverride?.margin,
  ),
  padding: cssValueWithOverride(
    spaceValuesWithFallback(
      [
        props.paddingTop ?? props.paddingVertical ?? props.padding,
        props.paddingRight ?? props.paddingHorizontal ?? props.padding,
        props.paddingBottom ?? props.paddingVertical ?? props.padding,
        props.paddingLeft ?? props.paddingHorizontal ?? props.padding,
      ],
      '0',
    )?.join(' '),
    props.cssVariablesOverride?.padding,
  ),
});
