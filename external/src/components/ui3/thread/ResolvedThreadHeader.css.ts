import { globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import {
  resolvedThreadHeader,
  resolvedThreadHeaderText,
} from '@cord-sdk/react/components/Thread.classnames.ts';
export { resolvedThreadHeader, resolvedThreadHeaderText };

globalStyle(`.${resolvedThreadHeader}`, {
  alignItems: 'center',
  display: 'flex',
  gap: cssVar('space-2xs'),
  paddingLeft: cssVar('space-2xs'),
});

globalStyle(`.${resolvedThreadHeaderText}`, {
  color: cssVar('color-content-primary'),
});
