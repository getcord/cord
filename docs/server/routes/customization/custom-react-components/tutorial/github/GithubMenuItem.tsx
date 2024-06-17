/** @jsxImportSource @emotion/react */

import type { betaV2 } from '@cord-sdk/react';

export function GithubMenuItem(props: betaV2.MenuItemProps) {
  if (props.menuItemAction === 'separator') {
    return (
      <li css={{ padding: '8px 0' }}>
        <div css={{ height: 1, borderTop: '1px #D0D7DE solid' }} />
      </li>
    );
  }

  return (
    <li
      onClick={props.onClick}
      css={{
        cursor: 'pointer',
        padding: '8px 16px',
        [':hover']: {
          background: '#0969DA',
          color: 'white',
        },
      }}
    >
      {props.label}
    </li>
  );
}
