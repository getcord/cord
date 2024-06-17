import { addSpaceVars, cssVar } from '../../common/ui/cssVariables.js';
import { globalStyle } from '../../common/ui/style.js';
import { getModifiedSelector } from '../../common/ui/modifiers.js';
import * as classes from './Threads.classnames.js';
export default classes;

const {
  inlineReplyButton,
  collapseInlineThreadButton,
  threads,
  inlineThread,
  inlineComposer,
  inlineThreadHeader,
  inlineThreadHeaderTitle,
  inlineThreadHeaderButton,
} = classes;

globalStyle(`.${threads}`, {
  position: 'relative',
  border: `1px solid ${cssVar('color-base-x-strong')}`,
  padding: cssVar('space-2xs'),
  borderRadius: cssVar('space-3xs'),
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space-2xs'),
  backgroundColor: cssVar('color-base'),
});

globalStyle(`.${inlineThread}`, {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: cssVar('color-base-x-strong'),
  borderRadius: cssVar('border-radius-medium'),
  display: 'flex',
  flexDirection: 'column',
});

globalStyle(`.${inlineThreadHeaderButton}`, {
  display: 'none',
  padding: cssVar('space-3xs'),
});

globalStyle(`.${inlineThread}:hover .${inlineThreadHeaderButton}`, {
  display: 'block',
});

globalStyle(
  getModifiedSelector(
    'expanded',
    `.${inlineThread} .${inlineThreadHeader} .${inlineThreadHeaderButton}`,
  ),
  {
    display: 'block',
  },
);

globalStyle(`.${inlineReplyButton}, .${collapseInlineThreadButton}`, {
  padding: `${cssVar('space-2xs')} calc(${cssVar('space-l')} + ${cssVar(
    'space-2xs',
  )})`,
  color: cssVar('color-brand-primary'),
  background: 'none',
  gap: cssVar('space-2xs'),
  cursor: 'pointer',
  borderRadius: cssVar('space-3xs'),
  display: 'flex',
});
globalStyle(
  `:is(.${inlineReplyButton}, .${collapseInlineThreadButton}):hover`,
  {
    background: cssVar('color-base-strong'),
  },
);

globalStyle(`.${inlineComposer}`, {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  padding: `0px ${cssVar('space-3xs')} ${cssVar('space-2xs')} ${cssVar(
    'space-2xs',
  )}`,
  marginLeft: addSpaceVars('l', '2xs'),
});

globalStyle(`.${inlineThreadHeader}`, {
  display: 'flex',
  gap: '8px',
  marginLeft: addSpaceVars('l', '2xs'),
  padding: `${cssVar('space-2xs')} ${cssVar('space-3xs')} ${cssVar(
    'space-2xs',
  )} ${cssVar('space-2xs')}`,
});

globalStyle(`.${inlineThreadHeaderTitle}`, {
  flexGrow: '1',
  fontWeight: cssVar('font-weight-bold'),
  lineHeight: cssVar('space-xl'),
  overflow: 'hidden',
  textDecoration: 'none',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
