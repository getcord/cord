import { Sizes } from 'common/const/Sizes.ts';
import { Spacing, spacingToCssString } from 'common/const/Spacing.ts';

test('Spacing - single values', () => {
  expect(spacingToCssString(Spacing.TOP_L)).toEqual(
    `${Sizes.LARGE}px 0px 0px 0px`,
  );
  expect(spacingToCssString(Spacing.RIGHT_S)).toEqual(
    `0px ${Sizes.SMALL}px 0px 0px`,
  );
  expect(spacingToCssString(Spacing.BOTTOM_M)).toEqual(
    `0px 0px ${Sizes.MEDIUM}px 0px`,
  );
  expect(spacingToCssString(Spacing.LEFT_L)).toEqual(
    `0px 0px 0px ${Sizes.LARGE}px`,
  );
  expect(spacingToCssString(Spacing.VERTICAL_XL)).toEqual(
    `${Sizes.XLARGE}px 0px ${Sizes.XLARGE}px 0px`,
  );
  expect(spacingToCssString(Spacing.HORIZONTAL_XXL)).toEqual(
    `0px ${Sizes.XXLARGE}px 0px ${Sizes.XXLARGE}px`,
  );
  expect(spacingToCssString(Spacing.ALL_S)).toEqual(
    `${Sizes.SMALL}px ${Sizes.SMALL}px ${Sizes.SMALL}px ${Sizes.SMALL}px`,
  );
});

test('Spacing - multiple values', () => {
  expect(
    spacingToCssString(
      Spacing.TOP_M | Spacing.BOTTOM_S | Spacing.LEFT_L | Spacing.RIGHT_L,
    ),
  ).toEqual(
    `${Sizes.MEDIUM}px ${Sizes.LARGE}px ${Sizes.SMALL}px ${Sizes.LARGE}px`,
  );
  // Largest value wins
  expect(spacingToCssString(Spacing.TOP_M | Spacing.TOP_L)).toEqual(
    `${Sizes.LARGE}px 0px 0px 0px`,
  );
  expect(spacingToCssString(Spacing.TOP_L | Spacing.TOP_M)).toEqual(
    `${Sizes.LARGE}px 0px 0px 0px`,
  );
  expect(spacingToCssString(Spacing.TOP_M | Spacing.VERTICAL_L)).toEqual(
    `${Sizes.LARGE}px 0px ${Sizes.LARGE}px 0px`,
  );
});
