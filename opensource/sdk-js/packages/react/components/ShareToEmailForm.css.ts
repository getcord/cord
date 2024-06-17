import { cssVar } from '../common/ui/cssVariables.js';
import { globalStyle } from '../common/ui/style.js';
import { cordifyClassname } from '../common/cordifyClassname.js';
import { subtitle } from './MenuItem.classnames.js';

export const emailForm = cordifyClassname('email-form');

export const emailInput = cordifyClassname('email-input');
globalStyle(`.${emailForm} .${emailInput}`, {
  border: 'none',
  background: cssVar('color-base-strong'),
  padding: cssVar('space-xs'),
  borderRadius: cssVar('border-radius-medium'),
  fontFamily: cssVar('font-family'),
  fontSize: cssVar('font-size-body'),
  width: '100%',
});

export const emailSubtitle = subtitle;
globalStyle(`.${emailForm} .${subtitle}`, {
  marginTop: cssVar('space-xs'),
  color: cssVar('color-content-secondary'),
});

export const emailFormGoBack = cordifyClassname('email-form-go-back');
globalStyle(`.${emailFormGoBack}`, {
  alignItems: 'center',
  borderRadius: cssVar('border-radius-medium'),
  color: cssVar('color-content-emphasis'),
  display: 'flex',
  gap: cssVar('space-2xs'),
  listStyle: 'none',
  padding: `${cssVar('space-4xs')} 0`,
  textAlign: 'center',
  width: '100%',
});

export const emailFormGoBackLabel = cordifyClassname(
  'email-form-go-back-label',
);
globalStyle(`.${emailFormGoBackLabel}`, {
  color: cssVar('color-content-emphasis'),
});

export const emailSubmitButton = cordifyClassname('email-form-submit-button');
globalStyle(`.${emailSubmitButton}`, {
  marginTop: cssVar('space-xs'),
});
