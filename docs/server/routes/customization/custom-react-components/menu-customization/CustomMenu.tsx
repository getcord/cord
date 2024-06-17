/** @jsxImportSource @emotion/react */
import { betaV2 } from '@cord-sdk/react';

export function CustomMenu(props: betaV2.MenuProps) {
  return (
    <div
      css={{
        border: '1px solid #9A6AFF',
        backgroundColor: 'white',
        padding: 4,
        borderRadius: 8,
      }}
    >
      <div style={{ color: '#9A6AFF', padding: 8 }}>Select an option...</div>
      <betaV2.Menu
        {...props}
        css={{
          border: 'none',
          boxShadow: 'none',
          margin: 0,
          padding: 0,
          backgroundColor: 'inherit',
        }}
      />
    </div>
  );
}
