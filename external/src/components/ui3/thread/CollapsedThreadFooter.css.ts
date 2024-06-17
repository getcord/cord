import { cssVar } from 'common/ui/cssVariables.ts';
import { CORD_V1, defaultGlobalStyle, globalStyle } from 'common/ui/style.ts';
import { threadFooterContainer } from '@cord-sdk/react/components/Thread.classnames.ts';
import { getModifiedSelector, MODIFIERS } from 'common/ui/modifiers.ts';
export { threadFooterContainer } from '@cord-sdk/react/components/Thread.classnames.ts';

globalStyle(`.${threadFooterContainer}:where(:not(${MODIFIERS.badged}))`, {
  alignItems: 'center',
  color: cssVar('color-content-emphasis'),
  cursor: 'pointer',
  display: 'flex',
  gap: cssVar('space-2xs'),
  padding: cssVar('space-2xs'),
  paddingLeft: `calc(${cssVar('space-3xs')} + ${cssVar('space-2xl')})`,
});

globalStyle(
  getModifiedSelector(['unseen', 'subscribed'], `.${threadFooterContainer}`),
  {
    color: cssVar('color-notification'),
  },
);

globalStyle(getModifiedSelector('badged', `.${threadFooterContainer}`), {
  paddingLeft: cssVar('space-l'),
});
defaultGlobalStyle(
  getModifiedSelector(
    'badged',
    `:where(.${CORD_V1} .${threadFooterContainer})::before`,
  ),
  {
    borderRadius: '50%',
    content: '',
    display: 'block',
    height: '8px',
    width: '8px',
    background: cssVar('color-notification'),
  },
);
