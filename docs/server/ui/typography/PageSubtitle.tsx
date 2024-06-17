/** @jsxImportSource @emotion/react */

type PageSubtitleProps = {
  children: React.ReactNode;
};

function PageSubtitle({ children }: PageSubtitleProps) {
  return (
    <p
      css={{
        fontFamily: 'var(--font-text)',
        fontSize: '24px',
        letterSpacing: '-1px',
        lineHeight: '130%',
        marginTop: '24px',
      }}
    >
      {children}
    </p>
  );
}

export default PageSubtitle;
