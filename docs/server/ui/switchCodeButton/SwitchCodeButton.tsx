/** @jsxImportSource @emotion/react */

import { useCallback } from 'react';

type SwitchCodeButtonProps = {
  displayName: string;
  selected: boolean;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
};

function SwitchCodeButton({
  displayName,
  selected,
  value,
  onChange,
  disabled,
}: SwitchCodeButtonProps) {
  const _onChange = useCallback(() => {
    onChange(value);
  }, [value, onChange]);
  return (
    <button
      css={buttonStyles({ selected, disabled })}
      disabled={disabled}
      onClick={_onChange}
      type="button"
      data-search-ignore={true}
      data-cord-search-ignore={true}
    >
      {displayName}
    </button>
  );
}

export function ExpandCodeButton({
  onClick,
  clipped,
}: {
  clipped: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      css={{
        ...buttonStyles({ selected: true, disabled: false }),
        marginLeft: 'auto',
      }}
      onClick={onClick}
    >
      {clipped ? 'Expand code' : 'Collapse code'}
    </button>
  );
}

const buttonStyles = ({
  selected,
  disabled,
}: {
  selected: boolean;
  disabled: boolean;
}) => ({
  backgroundColor: selected ? 'var(--color-purple)' : 'var(--color-greyDark)',
  border: 'none',
  borderRadius: 4,
  color: '#fff',
  fontSize: 14,
  padding: '4px 16px',
  marginRight: 8,
  ...(!disabled
    ? {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: selected
            ? 'var(--color-purpleLight)'
            : 'var(--color-greylight)',
          color: '#000',
        },
      }
    : {}),
});

export default SwitchCodeButton;
