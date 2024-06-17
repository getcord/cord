import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

export const fontBody = cordifyClassname('font-body');
globalStyle(`.${fontBody}`, {
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-body'),
  fontWeight: cssVar('font-weight-regular'),
  lineHeight: cssVar('line-height-body'),
  letterSpacing: 'inherit',
});

export const fontBodyEmphasis = cordifyClassname('font-body-emphasis');
globalStyle(`.${fontBodyEmphasis}`, {
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-body'),
  fontWeight: cssVar('font-weight-bold'),
  lineHeight: cssVar('line-height-body'),
  letterSpacing: 'inherit',
});

export const fontSmallLight = cordifyClassname('font-small-light');
globalStyle(`.${fontSmallLight}`, {
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-small'),
  fontWeight: cssVar('font-weight-regular'),
  lineHeight: cssVar('line-height-small'),
  letterSpacing: 'inherit',
});

export const fontSmall = cordifyClassname('font-small');
globalStyle(`.${fontSmall}`, {
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-small'),
  fontWeight: cssVar('font-weight-medium'),
  lineHeight: cssVar('line-height-small'),
  letterSpacing: 'inherit',
});

export const fontSmallEmphasis = cordifyClassname('font-small-emphasis');
globalStyle(`.${fontSmallEmphasis}`, {
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-small'),
  fontWeight: cssVar('font-weight-bold'),
  lineHeight: cssVar('line-height-small'),
  letterSpacing: 'inherit',
});
