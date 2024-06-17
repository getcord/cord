/** @jsxImportSource @emotion/react */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { startRoomSession } from 'demo-apps/util.ts';
import { Colors } from 'common/const/Colors.ts';
import type { DemoApp } from 'opensource/sample-apps/_common/ComponentsList.tsx';
import { ComponentsList } from 'opensource/sample-apps/_common/ComponentsList.tsx';
import type { ComponentNames } from 'opensource/sample-apps/_common/ComponentNameToIcon.tsx';
import { generateBreadcrumbList } from 'docs/lib/structuredData/structuredData.ts';

type DemoAppHeaderProps = {
  title: string;
  components: ComponentNames[];
  api: string[];
  darkMode?: boolean;
  app: DemoApp;
  description: string;
};

/** This is very similar to the <InformationHeader /> we show in the opensource demo apps  */
function DemoAppHeader({
  title,
  components,
  api,
  darkMode = false,
  app,
  description,
}: DemoAppHeaderProps) {
  const [hideMe, setHideMe] = useState(false);
  const [host, setHost] = useState('docs.cord.com');
  const location = useLocation();
  const jsonLDContent = useMemo(() => {
    const content = generateBreadcrumbList(location.pathname);
    if (content) {
      return (
        <script type="application/ld+json" id="ld-json">
          {JSON.stringify(content)}
        </script>
      );
    } else {
      return null;
    }
  }, [location.pathname]);

  useEffect(() => {
    setHost(window.location.host);
  }, [setHost]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const includeHeader = (urlParams.get('header') ?? 'true') !== 'false';
    if (!includeHeader) {
      document.body.classList.add('demo-no-header');
      setHideMe(true);
    }
  }, [setHideMe]);

  if (hideMe) {
    return <></>;
  }

  return (
    <>
      <Helmet>
        <title>{title} | Cord SDK</title>
        {jsonLDContent}
        <meta property="og:description" content={description} />
      </Helmet>
      <header
        css={{
          color: darkMode ? 'white' : 'black',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          left: 0,
          padding: '16px',
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 10,

          '& a': {
            textDecoration: 'none',
          },
        }}
      >
        <div
          css={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <BackButton host={host} darkMode={darkMode} />
          <h1 css={{ fontSize: 16, fontWeight: 400 }}>{title}</h1>
          <div css={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
            <ShareRoomButton />
          </div>
        </div>
        <ComponentsList
          components={components}
          api={api}
          darkMode={darkMode}
          app={app}
        />
      </header>
    </>
  );
}

function ShareRoomButton() {
  const [buttonText, setButtonText] = useState('Share room');

  const startRooms = useCallback(() => {
    startRoomSession();
    setButtonText('Invite copied!');

    setTimeout(() => setButtonText('Share room'), 2000);
  }, []);

  return (
    <button
      className={'share-room-button'}
      onClick={startRooms}
      type="button"
      css={{
        backgroundColor: Colors.BRAND_PURPLE_DARK,
        border: 0,
        color: 'white',
        display: 'flex',
        height: '32px',
        padding: '16px',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '32px',
        '&:hover': {
          backgroundColor: Colors.BRAND_PURPLE_DARKER,
        },
      }}
    >
      <ShareIcon />
      {buttonText}
    </button>
  );
}

function BackButton({ host, darkMode }: { host: string; darkMode: boolean }) {
  return (
    <a
      css={{
        borderRadius: '4px',
        display: 'flex',
        height: '32px',
        padding: '16px 8px',
        alignItems: 'center',
        gap: '8px',
        background: darkMode
          ? 'rgba(255, 255, 255, 0.10)'
          : 'rgba(0, 0, 0, 0.10)',
        color: darkMode ? 'white' : 'black',
      }}
      href={'//' + host + '/get-started/demo-apps'}
    >
      <ArrowBackIcon /> Back
    </a>
  );
}

function ArrowBackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none">
      <g clipPath="url(#a)">
        <mask
          id="b"
          style={{ maskType: 'luminance' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="20"
          height="20"
        >
          <path d="M0 0h20v20H0V0Z" fill="#fff" />
        </mask>
        <g mask="url(#b)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 18a8 8 0 1 0 0-16.001A8 8 0 0 0 10 18Zm3.25-7.25a.75.75 0 1 0 0-1.5H8.66l2.1-1.95a.75.75 0 1 0-1.02-1.1l-3.5 3.25a.75.75 0 0 0 0 1.1l3.5 3.25a.75.75 0 1 0 1.02-1.1l-2.1-1.95h4.59Z"
            fill="currentColor"
          />
        </g>
      </g>
      <defs>
        <clipPath id="a">
          <path fill="#fff" d="M0 0h20v20H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none">
      <path
        d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604c.042.262.042.53 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.475l6.733-3.366A2.513 2.513 0 0 1 13 4.5Z"
        fill="#fff"
      />
    </svg>
  );
}

export default DemoAppHeader;
