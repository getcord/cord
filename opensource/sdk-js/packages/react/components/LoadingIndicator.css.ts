import { globalStyle } from '../common/ui/style.js';
import { cordifyClassname } from '../common/cordifyClassname.js';

export const loadingIndicator = cordifyClassname('loading-indicator');

globalStyle(`.${loadingIndicator}`, {
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
});
