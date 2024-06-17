/** @jsxImportSource @emotion/react */

import { H5 } from 'docs/server/ui/typography/Typography.tsx';

type EmphasisCardTitleProps = {
  children: React.ReactNode;
};
export function EmphasisCardTitle({ children }: EmphasisCardTitleProps) {
  return <H5>{children}</H5>;
}

type EmphasisCardProps = {
  caption?: string;
  children: React.ReactNode;
  level?: 'normal' | 'alert';
  className?: string;
};

function EmphasisCard({
  children,
  caption,
  level = 'normal',
  className,
}: EmphasisCardProps) {
  return (
    <>
      <div
        css={{
          color: '#000',
          backgroundColor:
            level === 'alert'
              ? 'var(--color-pink)'
              : 'var(--color-purpleLight)',
          borderRadius: '4px',
          display: 'block',
          margin: caption ? '32px 0px 16px 0px' : '32px 0',
          padding: '8px 24px',
          '& code': {
            backgroundColor: 'var(--color-purpleHighlight)',
          },
        }}
        className={className}
      >
        {children}
      </div>
      {caption && (
        <p css={{ color: 'var(--color-contentSecondary)', fontSize: 16 }}>
          {caption}
        </p>
      )}
    </>
  );
}

export default EmphasisCard;
