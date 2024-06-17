/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';

type ComponentCardLayoutProps = {
  children: React.ReactNode;
};

export function ComponentCardLayout({ children }: ComponentCardLayoutProps) {
  return (
    <div
      css={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 24,
        [breakpoints.mobile]: { display: 'block' },
      }}
    >
      {children}
    </div>
  );
}

type ComponentCardProps = {
  linkTo: string;
  children: React.ReactNode;
};

export function ComponentCard({ linkTo, children }: ComponentCardProps) {
  return (
    <Link to={linkTo} css={{ flex: 1, '&&': { textDecoration: 'none' } }}>
      <figure>{children}</figure>
    </Link>
  );
}

type ComponentCardTitleProps = {
  children: React.ReactNode;
};

export function ComponentCardTitle({ children }: ComponentCardTitleProps) {
  return (
    <h5
      css={{
        fontFamily: '"FavoritWeb", monospace',
        fontSize: '16px',
        fontWeight: 'bold',
        marginRight: '8px',
        marginTop: '12px',
      }}
    >
      {children}
    </h5>
  );
}

type ComponentCardSubtitleProps = {
  children: React.ReactNode;
};

export function ComponentCardSubtitle({
  children,
}: ComponentCardSubtitleProps) {
  return (
    <figcaption
      css={{
        fontFamily: 'var(--font-text)',
        fontSize: '16px',
        marginBottom: '8px',
        marginRight: '8px',
      }}
    >
      {children}
    </figcaption>
  );
}
