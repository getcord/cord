/** @jsxImportSource @emotion/react */

import { forwardRef } from 'react';
import type { betaV2 } from '@cord-sdk/react';

export const CustomMenuButton = forwardRef(function CustomMenuButton(
  props: betaV2.GeneralButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { buttonAction: _buttonAction, icon: _icon, ...buttonProps } = props;

  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      css={{
        backgroundColor: '#9A6AFF',
        color: 'white',
        padding: 8,
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
      }}
    >
      Open menu
    </button>
  );
});
