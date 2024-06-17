/** @jsxImportSource @emotion/react */

import { Link, useLocation } from 'react-router-dom';

import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';
import Search from 'docs/server/ui/search/Search.tsx';

function Header() {
  const location = useLocation();

  return (
    <div
      css={{ position: 'absolute', top: 0, left: 0, width: '100%' }}
      data-cord-search-ignore="true"
      data-search-ignore="true"
    >
      <div
        css={{
          alignItems: 'center',
          backgroundColor: 'var(--color-purple)',
          color: '#fff',
          display: 'flex',
          height: '60px',
          justifyContent: 'space-between',
          position: 'fixed',
          top: 0,
          zIndex: 2,
          width: '100%',
        }}
      >
        <div
          css={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            marginLeft: 16,
            width: 240,
            [breakpoints.tablet]: {
              width: 'unset',
            },
          }}
        >
          <a href="https://cord.com/" css={{ flexShrink: 0 }}>
            <img src="/static/images/cord-logo.svg" alt="Cord Logo" />
          </a>
          <Link
            to="/"
            css={{
              alignItems: 'center',
              border: '1.5px #fff solid',
              borderRadius: '16px',
              display: 'flex',
              fontSize: '20px',
              height: '33px',
              justifyContent: 'center',
              lineHeight: '20px',
              '&&': {
                color: '#fff',
                textDecoration: 'none',
              },
              padding: '0 8px',
              '&:hover': {
                color: '#000',
                borderColor: '#000',
                '&&': {
                  textDecoration: 'none',
                },
              },
            }}
          >
            Docs
          </Link>
        </div>
        {location.pathname !== '/search' && (
          <Search limit={5} offset={0} fullPage={false} />
        )}
        <div
          css={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: 8,
            marginRight: 16,
            [breakpoints.tablet]: {
              display: 'none',
            },
          }}
        >
          <a
            href="https://console.cord.com/login"
            css={{
              border: '1.5px var(--color-purple) solid',
              borderRadius: '4px',
              padding: '3px 13px',
              '&&, &&:link': {
                color: '#fff',
                backgroundColor: 'rgba(18, 19, 20, 0.20)',
                textDecoration: 'none',
              },
              '&&:hover, &&:active': {
                border: '1.5px #fff solid',
              },
            }}
          >
            Sign in
          </a>
          <a
            href="https://console.cord.com/signup"
            css={{
              border: '1.5px var(--color-base) solid',
              borderRadius: '50vh',
              padding: '3px 13px', // -3 on both values for the border sizing
              '&&, &&:link': {
                color: 'var(--color-greyXdark)',
                backgroundColor: 'var(--color-base)',
                textDecoration: 'none',
              },
              '&&:hover, &&:active': {
                border: '1.5px #fff solid',
              },
            }}
          >
            Start now
          </a>
        </div>
      </div>
    </div>
  );
}

export default Header;
