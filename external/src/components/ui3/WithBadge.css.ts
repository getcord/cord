import { cssVar } from 'common/ui/cssVariables.ts';
import {
  CORD_V1,
  cordifyClassname,
  defaultGlobalStyle,
} from 'common/ui/style.ts';

export const badge = cordifyClassname('badge');
defaultGlobalStyle(`:where(.${CORD_V1}) :where(.${badge})::after`, {
  alignItems: 'center',
  background: cssVar('color-notification'),
  border: `1px solid ${cssVar('color-base')}`,
  borderRadius: cssVar('border-radius-large'),
  color: cssVar('color-base'),
  display: 'inline-flex',
  fontSize: '10px',
  height: cssVar('space-m'),
  justifyContent: 'center',
  lineHeight: '10px',
  minWidth: cssVar('space-m'),
  padding: `0 ${cssVar('space-3xs')}`,
  pointerEvents: 'none',
  content: 'attr(data-cord-badge-count)',
  position: 'absolute',
  right: 0,
  top: 0,
  transform: 'translate(50%, -50%)',
});
