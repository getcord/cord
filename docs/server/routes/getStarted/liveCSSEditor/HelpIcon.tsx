/** @jsxImportSource @emotion/react */

import { useCallback, useState } from 'react';
import WithTooltip from 'docs/server/ui/tooltip/WithTooltip.tsx';
import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

type HelpIconProps = {
  label: string;
};
const styles = {
  helpIcon: {
    cursor: 'pointer',
    color: '#97979F',
    '&:hover': {
      color: '#121314',
    },
    width: '18px',
    height: '18px',
    padding: '2px',
  },
  tooltip: {
    fontFamily: '"FavoritWeb", monospace',
  },
} as const;

export function HelpIcon({ label }: HelpIconProps) {
  const [clickedRecently, setClickedRecently] = useState(false);
  const onClick = useCallback(() => {
    void navigator.clipboard.writeText(label);
    setClickedRecently(true);
    setTimeout(() => setClickedRecently(false), 2000);
  }, [label]);

  const actualLabel = clickedRecently
    ? `Copied '${label}' to clipboard`
    : label;

  return (
    <WithTooltip label={actualLabel}>
      <Icon size="small" name="Help" css={styles.helpIcon} onClick={onClick} />
    </WithTooltip>
  );
}
