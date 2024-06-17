/** @jsxImportSource @emotion/react */

import type { ReactNode } from 'react';

export function Warning({
  children,
  type,
}: {
  children: ReactNode;
  type: 'deprecated' | 'beta';
}) {
  return (
    <section
      css={{
        backgroundColor:
          type === 'deprecated' ? 'var(--color-pink)' : 'var(--color-acid)',
        borderRadius: '4px',
        display: 'block',
        flex: 1,
        padding: '8px 16px',
        '&&': {
          textDecoration: 'none',
        },
      }}
    >
      {children}
    </section>
  );
}
