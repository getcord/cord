import { cordifyClassname } from '../common/cordifyClassname.js';

export const cursor = cordifyClassname('live-cursors-cursor');
export const icon = cordifyClassname('live-cursors-icon');
export const label = cordifyClassname('live-cursors-label');
export const name = cordifyClassname('live-cursors-name');
export const colorPalette = cordifyClassname('color-palette');
export const cursorClick = cordifyClassname('live-cursors-click');

export const liveCursorsClassnamesDocs = {
  [cursor]:
    'Applied to the cursor container div containing the cursor icon and cursor label elements.',
  [icon]: 'Applied to the cursor icon SVG element.',
  [label]: 'Applied to the div containing the Cord user Avatar and user name.',
  [name]: 'Applied to the element containing the user name',
};
