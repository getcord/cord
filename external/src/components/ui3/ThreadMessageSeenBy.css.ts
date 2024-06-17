import { cssVar } from 'common/ui/cssVariables.ts';
import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

export const threadSeenBy = cordifyClassname('thread-seen-by-container');
globalStyle(`.${threadSeenBy}`, {
  alignSelf: 'start',
  color: cssVar('color-content-secondary'),
  display: 'flex',
  padding: `${cssVar('space-3xs')} ${cssVar('space-3xs')} ${cssVar(
    'space-2xs',
  )} ${cssVar('space-2xs')} `,
  paddingInlineStart: `calc(2 * ${cssVar('space-2xs')} + 20px)`,
});
