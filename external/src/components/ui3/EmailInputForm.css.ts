import { cssVar } from 'common/ui/cssVariables.ts';
import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

export const emailForm = cordifyClassname('email-form');
globalStyle(`.${emailForm}`, {
  padding: cssVar('space-2xs'),
  paddingTop: 0,
});

export const emailInput = cordifyClassname('input');
globalStyle(`.${emailForm} :where(.${emailInput})`, {
  border: 'none',
  background: cssVar('color-base-strong'),
  padding: cssVar('space-xs'),
  borderRadius: cssVar('border-radius-medium'),
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-body'),
  width: '100%',
});

export const subtitle = cordifyClassname('subtitle');
globalStyle(`.${emailForm} :where(.${subtitle})`, {
  marginTop: cssVar('space-xs'),
  color: cssVar('color-content-secondary'),
});
