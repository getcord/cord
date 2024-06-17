import { Sizes } from 'common/const/Sizes.ts';

export type SpacingSize = number;

const SPACING_SIZES = ['XXXL', 'XXL', 'XL', 'L', 'M', 'S', 'XS'] as const;
type SpacingSizeStr = (typeof SPACING_SIZES)[number];

const SPACING_SIZE_MAP: { [size in SpacingSizeStr]: number } = {
  XS: Sizes.XSMALL,
  S: Sizes.SMALL,
  M: Sizes.MEDIUM,
  L: Sizes.LARGE,
  XL: Sizes.XLARGE,
  XXL: Sizes.XXLARGE,
  XXXL: Sizes.XXXLARGE,
};

const DIMENSIONS = ['TOP', 'RIGHT', 'BOTTOM', 'LEFT'] as const;
type Dimension = (typeof DIMENSIONS)[number];

const DIMENSION_COMBINATIONS = ['VERTICAL', 'HORIZONTAL', 'ALL'] as const;
type DimensionCombination = (typeof DIMENSION_COMBINATIONS)[number];

const BITS_PER_DIMENSION = SPACING_SIZES.length;

type SpacingType = `${Dimension | DimensionCombination}_${SpacingSizeStr}`;

export const Spacing: { [key in SpacingType]: number } = {} as any;

let index = 1;
for (const dimension of DIMENSIONS) {
  for (const size of SPACING_SIZES) {
    Spacing[`${dimension}_${size}` as SpacingType] = index;
    index <<= 1;
  }
}
for (const size of SPACING_SIZES) {
  Spacing[`VERTICAL_${size}` as SpacingType] =
    Spacing[`TOP_${size}` as SpacingType] |
    Spacing[`BOTTOM_${size}` as SpacingType];
  Spacing[`HORIZONTAL_${size}` as SpacingType] =
    Spacing[`LEFT_${size}` as SpacingType] |
    Spacing[`RIGHT_${size}` as SpacingType];
  Spacing[`ALL_${size}` as SpacingType] =
    Spacing[`VERTICAL_${size}` as SpacingType] |
    Spacing[`HORIZONTAL_${size}` as SpacingType];
}

function sizeFromMask(mask: number) {
  if (mask === 0) {
    return 0;
  }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
  let index = 0;
  let bit = 1;
  while ((mask & bit) === 0) {
    bit <<= 1;
    index++;
  }
  return SPACING_SIZE_MAP[SPACING_SIZES[index]];
}

export function spacingToCssString(spacing: number) {
  const top = spacing & 0xff;
  const right = (spacing >> BITS_PER_DIMENSION) & 0xff;
  const bottom = (spacing >> (BITS_PER_DIMENSION * 2)) & 0xff;
  const left = (spacing >> (BITS_PER_DIMENSION * 3)) & 0xff;

  return `${sizeFromMask(top)}px ${sizeFromMask(right)}px ${sizeFromMask(
    bottom,
  )}px ${sizeFromMask(left)}px`;
}
