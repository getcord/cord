/** @jsxImportSource @emotion/react */

import * as React from 'react';
import { Link } from 'react-router-dom';
import type { NavLink } from 'docs/server/navigation.tsx';

type SubSubnavProps = {
  active: boolean;
  onItemClick: () => void;
  pathname: string;
  pages: NavLink[];
};

export function SubSubnav({
  active: parentActive,
  onItemClick,
  pages,
  pathname,
}: SubSubnavProps) {
  return (
    <ol
      css={{
        listStyleType: 'none',
        overflow: 'hidden',
        paddingLeft: 8,
        position: 'relative',
      }}
      style={{
        display: parentActive ? undefined : 'none',
      }}
    >
      {pages.map(({ name, linkTo, hidden }) => {
        if (hidden) {
          return <React.Fragment key={name}></React.Fragment>;
        }
        const active = pathname === linkTo;
        return (
          <li key={linkTo} css={{ display: 'block' }}>
            <Link
              tabIndex={parentActive ? 0 : -1}
              to={linkTo}
              onClick={onItemClick}
              css={{
                '&&': {
                  display: 'block',
                  color: active ? 'var(--color-purple)' : 'black',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  lineHeight: '20px',
                  marginBottom: 8,
                  padding: '8px 8px 8px 24px',
                  left: -12,
                  position: 'relative',
                  textDecoration: active ? 'underline' : 'none',
                  '&:hover': {
                    color: 'var(--color-purple)',
                  },
                },
              }}
            >
              {name}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
