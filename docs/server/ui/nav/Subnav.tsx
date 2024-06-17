/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import * as React from 'react';
import normalizePath from 'docs/server/ui/nav/util.ts';
import type { NavLink } from 'docs/server/navigation.tsx';
import { SubSubnav } from 'docs/server/ui/nav/SubSubNav.tsx';
import { VersionContext } from 'docs/server/App.tsx';

type SubnavProps = {
  active: boolean;
  onItemClick: () => void;
  pathname: string;
  pages: NavLink[];
  normalizedPathSegments: string[];
};

export function Subnav({
  active: parentActive,
  onItemClick,
  pages,
  pathname,
  normalizedPathSegments,
}: SubnavProps) {
  const { version: currentVersion } = React.useContext(VersionContext);

  return (
    <ol
      css={{
        listStyleType: 'none',
        margin: '16px 8px 0 0',
        overflow: 'hidden',
        paddingLeft: 8,
        position: 'relative',
        '&:before': {
          backgroundColor: 'var(--color-greylight)',
          content: '"\\00a0"', // non-breaking space code point
          display: 'block',
          left: 3.5,
          position: 'absolute',
          top: 14,
          bottom: 18,
          width: 1,
        },
      }}
      style={{
        display: parentActive ? undefined : 'none',
      }}
    >
      {pages.map(({ name, linkTo, subnav, hidden, version }) => {
        if (hidden || (version && !version.includes(currentVersion))) {
          return <React.Fragment key={name}></React.Fragment>;
        }
        const childActive =
          pathname === linkTo ||
          normalizePath(linkTo).substring(1) ===
            normalizedPathSegments[0] + '/' + normalizedPathSegments[1];
        return (
          <li key={linkTo} css={{ display: 'block' }}>
            <Link
              tabIndex={parentActive ? 0 : -1}
              to={linkTo}
              onClick={onItemClick}
              css={{
                '&&': {
                  display: 'block',
                  color: childActive ? 'var(--color-purple)' : 'black',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  lineHeight: '20px',
                  marginBottom: 8,
                  padding: '8px 8px 8px 24px',
                  left: -12,
                  position: 'relative',
                  textDecoration: 'none',
                  '&:before': {
                    backgroundColor: childActive
                      ? 'var(--color-purple)'
                      : 'var(--color-greylight)',
                    border: '4px #fff solid',
                    borderRadius: '100%',
                    content: '"\\00a0"', // non-breaking space code point
                    display: 'block',
                    height: 16,
                    left: 0,
                    position: 'absolute',
                    top: 10,
                    width: 16,
                  },
                  '&:hover': {
                    color: 'var(--color-purple)',
                  },
                },
              }}
            >
              {name}
            </Link>
            {subnav && (
              <SubSubnav
                active={childActive}
                onItemClick={onItemClick}
                pathname={pathname}
                pages={subnav}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
