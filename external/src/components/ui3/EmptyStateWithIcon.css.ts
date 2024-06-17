import { globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import * as classes from '@cord-sdk/react/components/helpers/EmptyStateWithIcon.classnames.ts';
export * from '@cord-sdk/react/components/helpers/EmptyStateWithIcon.classnames.ts';

const { emptyStateContainer, emptyStateTitle, emptyStateBody } = classes;

globalStyle(`.${emptyStateContainer}`, {
  flexShrink: 0,
  margin: 'auto 0',
  overflow: 'auto',
  padding: cssVar('space-2xs'),
});

globalStyle(`.${emptyStateContainer} :where(.${emptyStateTitle})`, {
  color: cssVar('color-content-emphasis'),
  margin: `0 0 ${cssVar('space-2xs')} 0`,
  fontWeight: cssVar('font-weight-bold'),
});

globalStyle(`.${emptyStateContainer} :where(.${emptyStateBody})`, {
  color: cssVar('color-content-primary'),
  fontWeight: cssVar('font-weight-regular'),
});
