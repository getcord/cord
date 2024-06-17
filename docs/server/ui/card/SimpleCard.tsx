/** @jsxImportSource @emotion/react */

import { H5 } from 'docs/server/ui/typography/Typography.tsx';

type SimpleCardTitleProps = {
  children: React.ReactNode;
};
export function SimpleCardTitle({ children }: SimpleCardTitleProps) {
  return <H5>{children}</H5>;
}

type SimpleCardProps = {
  children: React.ReactNode;
};

function SimpleCard({ children }: SimpleCardProps) {
  return (
    <div
      css={{
        backgroundColor: 'var(--color-greyXlight)',
        borderRadius: '4px',
        display: 'block',
        margin: '16px 0',
        padding: '16px',
      }}
    >
      {children}
    </div>
  );
}

export default SimpleCard;
