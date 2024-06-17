/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { H5 } from 'docs/server/ui/typography/Typography.tsx';

type NextUpCardProps = {
  title: string;
  children: React.ReactNode;
  linkTo: string;
  beta?: boolean;
};

function NextUpCard({ title, children, linkTo, beta }: NextUpCardProps) {
  return (
    <Link
      to={linkTo}
      css={{
        backgroundColor: 'var(--color-greyXlight)',
        borderRadius: '4px',
        display: 'block',
        flex: 1,
        padding: '8px 16px',
        '&&': {
          textDecoration: 'none',
        },
      }}
    >
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <H5 dontShowInTableOfContents={true}>{title}</H5>
        {beta ? (
          <div
            css={{
              backgroundColor: 'var(--color-purple)',
              borderRadius: 4,
              padding: '4px 8px',
              height: 'fit-content',
              color: 'var(--color-base)',
              fontSize: '14px',
              '&:hover': {
                color: 'var(--color-base)',
              },
            }}
          >
            Beta
          </div>
        ) : null}
      </div>
      <p>{children}</p>
    </Link>
  );
}

export default NextUpCard;
