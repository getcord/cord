import { cssVar } from '../../common/ui/cssVariables.js';
import { globalStyle } from '../../common/ui/style.js';
import { threadSeenBy } from '../../components/Thread.classnames.js';
export { threadSeenBy };

globalStyle(`.${threadSeenBy}`, {
  alignSelf: 'start',
  color: cssVar('color-content-secondary'),
  display: 'flex',
  padding: `${cssVar('space-3xs')} ${cssVar('space-3xs')} ${cssVar(
    'space-2xs',
  )} ${cssVar('space-2xs')} `,
  paddingInlineStart: `calc(2 * ${cssVar('space-2xs')} + 20px)`,
});
