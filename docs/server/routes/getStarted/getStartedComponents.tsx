/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';

type GuideStepOuterProps = {
  children: React.ReactNode;
};

export function GuideStepOuter({ children }: GuideStepOuterProps) {
  return (
    <div
      css={{
        display: 'flex',
        gap: '24px',
        marginBottom: '64px',
        [breakpoints.desktop]: { display: 'block' },
      }}
    >
      {children}
    </div>
  );
}

type GuideStepLeftSideProps = {
  children: React.ReactNode;
};

export function GuideStepLeftSide({ children }: GuideStepLeftSideProps) {
  return (
    <div
      css={{
        flexBasis: '320px',
        minWidth: '320px',
        '& h4': {
          marginTop: 0,
        },
      }}
    >
      {children}
    </div>
  );
}

type EmphasisButtonProps = {
  linkTo: string;
  children: string;
};

export function EmphasisButton({ linkTo, children }: EmphasisButtonProps) {
  return (
    <Link to={linkTo} css={{ flex: 1, '&&': { textDecoration: 'none' } }}>
      <button
        css={{
          backgroundColor: 'var(--color-purple)',
          border: 'none',
          borderRadius: 100,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 20,
          fontWeight: '400',
          letterSpacing: '-0.02em',
          margin: '8px 0 24px 0',
          padding: '8px 16px',
        }}
        type="button"
      >
        {children}
      </button>
    </Link>
  );
}
