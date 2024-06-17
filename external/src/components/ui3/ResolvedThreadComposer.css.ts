import { cssVar } from 'common/ui/cssVariables.ts';
import { cordifyClassname, globalStyle } from 'common/ui/style.ts';

export const container = cordifyClassname('resolved-thread-composer');
globalStyle(`.${container}`, {
  alignItems: 'center',
  border: cssVar('composer-border'),
  borderRadius: cssVar('composer-border-radius'),
  display: 'flex',
  backgroundColor: cssVar('color-base-strong'),
  padding: cssVar('space-2xs'),
  margin: cssVar('space-2xs'),
});

export const resolvedComposerText = cordifyClassname(
  'resolved-thread-composer-text',
);
globalStyle(`.${container} :where(.${resolvedComposerText})`, {
  flexGrow: 1,
  color: cssVar('color-content-primary'),
});
