import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { addSpaceVars, cssVar } from 'common/ui/cssVariables.ts';

export const menuNavigationItem = cordifyClassname('menu-navigation-item');
globalStyle(`.${menuNavigationItem}`, {
  alignItems: 'center',
  borderRadius: cssVar('border-radius-medium'),
  color: cssVar('color-content-emphasis'),
  display: 'flex',
  gap: cssVar('space-2xs'),
  listStyle: 'none',
  padding: `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}`,
  textAlign: 'center',
  width: '100%',
});

export const label = cordifyClassname('label');
globalStyle(`.${menuNavigationItem} :where(.${label})`, {
  color: cssVar('color-content-emphasis'),
});
