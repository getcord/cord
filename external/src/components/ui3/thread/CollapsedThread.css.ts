import { cssVar } from 'common/ui/cssVariables.ts';
import { globalStyle } from 'common/ui/style.ts';
import { getModifiedSelector } from 'common/ui/modifiers.ts';
import { collapsedThread } from '@cord-sdk/react/components/Thread.classnames.ts';
export { collapsedThread };

globalStyle(`.${collapsedThread}`, {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space-3xs'),
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  position: 'relative',
  borderRadius: cssVar('border-radius-medium'),
});
globalStyle(getModifiedSelector('highlighted', `.${collapsedThread}`), {
  backgroundColor: cssVar('color-base-strong'),
});

globalStyle(`.${collapsedThread}:hover`, {
  boxShadow: cssVar('shadow-small'),
});
