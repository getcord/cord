import { globalStyle } from '@vanilla-extract/css';
import { cordifyClassname } from '../../common/cordifyClassname.js';

export const input = cordifyClassname('composer-attachment-input');
globalStyle(`.${input}`, {
  display: 'none',
});
