/** @jsxImportSource @emotion/react */

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import ToggleButton from 'docs/server/ui/nav/ToggleButton.tsx';
import { Subnav } from 'docs/server/ui/nav/Subnav.tsx';
import navigation from 'docs/server/navigation.tsx';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';
import normalizePath from 'docs/server/ui/nav/util.ts';
import { VersionToggle } from 'docs/server/ui/nav/VersionToggle.tsx';

export function NavSidebar() {
  const [expandedOnMobile, setExpandedOnMobile] = useState(false);
  const location = useLocation();
  const { pathname } = location;
  const normalizedPathSegments = (pathname === '/' ? '/get-started' : pathname)
    .split('/')
    .filter(Boolean);

  const onItemClick = useCallback(() => {
    setExpandedOnMobile(false);
  }, [setExpandedOnMobile]);

  return (
    <nav>
      <ToggleButton
        expanded={expandedOnMobile}
        setExpanded={setExpandedOnMobile}
      />
      <div
        css={{
          width: '240px',
          [breakpoints.tablet]: {
            height: expandedOnMobile ? 'auto' : 0,
            overflow: 'hidden',
            width: '100%',
          },
        }}
      >
        <ol
          css={{
            fontSize: 16,
            lineHeight: '24px',
            listStyleType: 'none',
            margin: 0,
            padding: '32px 8px 32px 16px',
            [breakpoints.tablet]: {
              paddingTop: 0,
            },
          }}
        >
          {navigation.map(
            ({ name, linkTo, subnav, hidden, showVersionToggle }) => {
              if (hidden) {
                return <React.Fragment key={name}></React.Fragment>;
              }
              const active =
                pathname === linkTo ||
                normalizePath(linkTo).substring(1) ===
                  normalizedPathSegments[0];

              return (
                <li
                  key={name}
                  css={{
                    display: 'block',
                    padding: '8px 8px 4px 0',
                  }}
                >
                  <Link
                    to={linkTo}
                    onClick={onItemClick}
                    css={{
                      '&&': {
                        background: active
                          ? 'var(--color-purpleLight)'
                          : 'var(--color-greyXlight)',
                        borderRadius: 4,
                        color: active ? 'var(--color-purple)' : '#000',
                        display: 'block',
                        fontWeight: 'bold',
                        height: '40px',
                        lineHeight: '24px',
                        padding: 8,
                        textDecoration: 'none',
                        '&:hover': {
                          color: 'var(--color-purple)',
                          textDecoration: 'none',
                        },
                      },
                    }}
                  >
                    {name}
                  </Link>
                  {active && showVersionToggle ? <VersionToggle /> : null}
                  {subnav && (
                    <Subnav
                      key={'subnav-for-' + linkTo}
                      active={active}
                      onItemClick={onItemClick}
                      pages={subnav}
                      pathname={pathname}
                      normalizedPathSegments={normalizedPathSegments}
                    />
                  )}
                </li>
              );
            },
          )}
        </ol>
      </div>
    </nav>
  );
}
