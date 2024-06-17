/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import breakpoints from 'docs/lib/css/emotionMediaQueries.ts';

type TwoLineHeadingProps = {
  pretitle: string;
  pretitleLinkTo?: string;
  title: string;
};

function TwoLineHeading({
  pretitle,
  pretitleLinkTo,
  title,
}: TwoLineHeadingProps) {
  return (
    <div css={{ position: 'relative', paddingTop: '40px' }}>
      <h1
        id="mainTitle"
        css={{
          backgroundColor: 'var(--color-notionBlack)',
          border: '2px var(--color-notionBlack) solid',
          borderRadius: '32px',
          [breakpoints.tablet]: {
            borderRadius: '24px',
          },
          '&&': {
            borderBottomLeftRadius: 2,
          },
          color: '#fff',
          fontSize: '48px',
          fontWeight: 'normal',
          letterSpacing: '-0.065em',
          lineHeight: '48px',
          padding: '24px 32px 20px 24px',
        }}
      >
        {title}
      </h1>
      <div
        css={{
          position: 'absolute',
          top: 0,
          fontSize: '14px',
          color: 'var(--color-contentPrimary)',
        }}
        data-cord-search-ignore={true}
        data-search-ignore={true}
      >
        {pretitleLinkTo ? (
          <Link
            to={pretitleLinkTo}
            css={{
              // && for a specificity bump
              '&&': {
                fontSize: '14px',
                color: 'var(--color-contentPrimary)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
            }}
          >
            {pretitle}
          </Link>
        ) : (
          <div css={{ display: 'inline' }}>{pretitle}</div>
        )}
        &nbsp;/
      </div>
    </div>
  );
}

type BigHeadingProps = {
  title: string;
};

function BigHeading({ title }: BigHeadingProps) {
  return (
    <h1
      css={{
        backgroundColor: 'white',
        border: '3px var(--color-notionBlack) solid',
        borderRadius: '56px',
        '&&': {
          // extra specificity so it applies across media queries
          borderBottomLeftRadius: 4,
        },
        color: 'var(--color-notionBlack)',
        fontSize: 96,
        fontWeight: 'normal',
        letterSpacing: '-0.065em',
        lineHeight: '96px',
        padding: '32px 48px 24px 40px',
        [breakpoints.tablet]: {
          border: '2px var(--color-notionBlack) solid',
          borderRadius: '24px',
          fontSize: 48,
          lineHeight: '48px',
          padding: '24px 32px 20px 24px',
        },
      }}
    >
      {title}
    </h1>
  );
}

type HeadingProps = {
  pretitle?: string;
  pretitleLinkTo?: string;
  title: string;
};

function Heading({ pretitle, pretitleLinkTo, title }: HeadingProps) {
  if (pretitle) {
    return (
      <TwoLineHeading
        pretitle={pretitle}
        pretitleLinkTo={pretitleLinkTo}
        title={title}
      />
    );
  }

  return <BigHeading title={title} />;
}

export default Heading;
