/** @jsxImportSource @emotion/react */

type LiveDemoCardTextProps = {
  className?: string;
  children: React.ReactNode;
};

function LiveDemoCardText({ className, children }: LiveDemoCardTextProps) {
  return (
    <div
      css={{
        '& p': {
          color: 'var(--cord-color-content-primary, #696A6C)',
          fontSize: '14px',
          lineHeight: '18px',
          padding: 0,
        },
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export default LiveDemoCardText;
