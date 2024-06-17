/** @jsxImportSource @emotion/react */

type TitleAndDescriptionProps = React.PropsWithChildren<{
  title: string;
  description: string;
}>;
export function TitleAndDescription({
  title,
  description,
  children,
}: TitleAndDescriptionProps) {
  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div css={{ fontSize: '24px', lineHeight: '20px', fontWeight: 400 }}>
        {title}
      </div>
      <div css={{ fontSize: '14px' }}>{description}</div>
      {children}
    </div>
  );
}
