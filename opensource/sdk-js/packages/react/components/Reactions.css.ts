import { globalStyle } from '../common/ui/style.js';
import { EMOJI_STYLE } from '../common/lib/styles.js';
import { cssVar, addSpaceVars } from '../common/ui/cssVariables.js';
import { MODIFIERS } from '../common/ui/modifiers.js';
import { message } from './Message.classnames.js';
import * as classes from './Reactions.classnames.js';
export default classes;

const { reactionsContainer, reactionList, pill, emoji, count } = classes;

globalStyle(`:is(.${reactionsContainer}, .${reactionList})`, {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
});

globalStyle(`:where(.${reactionList}) .${pill}`, {
  alignItems: 'center',
  backgroundColor: cssVar('color-base-strong'),
  borderRadius: cssVar('border-radius-medium'),
  cursor: 'pointer',
  display: 'flex',
  gap: cssVar('space-3xs'),
  justifyContent: 'space-between',
  minWidth: addSpaceVars('m', 'l'),
  padding: cssVar('space-3xs'),
});
globalStyle(`:where(.${reactionList}) .${pill}:hover`, {
  backgroundColor: cssVar('color-base-x-strong'),
});
globalStyle(`.${reactionList} :where(.${MODIFIERS.unseen}.${pill})`, {
  boxShadow: `inset 0 0 0 1px ${cssVar('color-notification')}`,
});

globalStyle(`:where(.${reactionList}) .${MODIFIERS.fromViewer}`, {
  backgroundColor: cssVar('color-base-x-strong'),
});

globalStyle(`:where(.${reactionList}) .${emoji}`, {
  ...EMOJI_STYLE,
  color: cssVar('color-content-emphasis'),
  lineHeight: cssVar('space-m'),
});
globalStyle(`:where(.${reactionList}) .${count}`, {
  color: cssVar('color-content-emphasis'),
});
globalStyle(`.${reactionList} :where(.${MODIFIERS.unseen}.${count})`, {
  color: cssVar('color-notification'),
  fontWeight: 700,
});

globalStyle(`:where(.${message}) .${reactionsContainer}`, {
  gridArea: 'reactions',
});
