/** @jsxImportSource @emotion/react */

import { useCallback } from 'react';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';

type ToggleButtonProps = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

function ToggleButton({ expanded, setExpanded }: ToggleButtonProps) {
  const toggleVisibility = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  return (
    <button
      css={{
        background: '#fff',
        '&:hover, &:active': {
          background: 'var(--color-greyXlight)',
        },
        border: '1px #000 solid',
        borderRadius: 24,
        cursor: 'pointer',
        display: 'none',
        fontWeight: 'bold',
        height: 48,
        margin: '24px 16px',
        padding: '0 24px 0 24px',
        [breakpoints.tablet]: {
          display: 'flex',
          alignItems: 'center',
        },
      }}
      onClick={toggleVisibility}
      type="button"
    >
      {expanded ? (
        <>
          <span
            css={{
              display: 'block',
              position: 'relative',
              width: 16,
              height: 16,
              marginRight: 16,
            }}
          >
            <span
              css={{
                background: '#000',
                display: 'block',
                height: 16,
                left: 6,
                position: 'absolute',
                transform: 'rotate(45deg)',
                width: 2,
              }}
            />
            <span
              css={{
                background: '#000',
                display: 'block',
                height: 16,
                left: 6,
                position: 'absolute',
                transform: 'rotate(135deg)',
                width: 2,
              }}
            />
          </span>
          <span>Close menu</span>
        </>
      ) : (
        <>
          <span
            css={{
              display: 'block',
              height: 16,
              marginRight: 16,
              position: 'relative',
              width: 16,
            }}
          >
            <span
              css={{
                background: '#000',
                display: 'block',
                height: 2,
                position: 'absolute',
                top: 2,
                width: 16,
              }}
            />
            <span
              css={{
                background: '#000',
                display: 'block',
                width: 16,
                position: 'absolute',
                height: 2,
                top: 7,
              }}
            />
            <span
              css={{
                background: '#000',
                display: 'block',
                height: 2,
                position: 'absolute',
                width: 16,
                bottom: 2,
              }}
            />
          </span>
          <span>Menu</span>
        </>
      )}
    </button>
  );
}

export default ToggleButton;
