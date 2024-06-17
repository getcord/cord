import { cssVar } from '../../common/ui/cssVariables.js';
import { globalStyle } from '../../common/ui/style.js';
import * as classes from './EmojiPicker.classnames.js';

export default classes;

const { emojiPicker } = classes;

globalStyle(`.${emojiPicker}`, {
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  borderRadius: cssVar('border-radius-medium'),
  boxShadow: cssVar('shadow-small'),
  overflow: 'hidden',
  width: '270px',
  height: '300px',
  // https://www.npmjs.com/package/emoji-picker-element#css-variables
  vars: {
    '--background': cssVar('color-base'),
    '--border-size': '0px',
    '--category-emoji-size': cssVar('space-s'),
    '--category-font-size': cssVar('space-m'),
    '--emoji-padding': cssVar('space-2xs'),
    '--emoji-size': cssVar('space-l'),
    '--input-border-color': cssVar('color-base-x-strong'),
    '--input-border-radius': cssVar('border-radius-medium'),
    '--input-font-color': cssVar('color-content-primary'),
    '--input-font-size': cssVar('space-s'),
    '--input-padding': `${cssVar('space-3xs')} ${cssVar('space-2xs')}`,
    '--input-placeholder-color': cssVar('color-content-secondary'),
    '--num-columns': '6',
    '--outline-color': cssVar('color-base-x-strong'),
    '--skintone-border-radius': cssVar('space-m'),
  },
});
