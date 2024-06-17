/** @jsxImportSource @emotion/react */

import EmphasisCard from 'docs/server/ui/card/EmphasisCard.tsx';

type LiveDemoCardProps = {
  children: React.ReactNode;
  caption?: string;
  className?: string;
  showTag?: boolean;
  showAsRow?: boolean;
};

function LiveDemoCard({
  children,
  caption,
  className,
  showTag = true,
  showAsRow = false,
}: LiveDemoCardProps) {
  return (
    <EmphasisCard caption={caption}>
      <div
        css={{
          position: 'relative',
        }}
      >
        <div
          css={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '48px 24px 24px 24px',
            flexDirection: showAsRow ? 'row' : 'column',
          }}
          className={className}
        >
          {children}
        </div>
        {showTag && (
          <div
            css={{
              backgroundColor: 'var(--color-purple)',
              borderRadius: 2,
              color: '#fff',
              fontSize: 14,
              left: -20,
              padding: '2px 8px',
              pointerEvents: 'none',
              position: 'absolute',
              top: -4, // undo the top padding of the EmphasisCard
            }}
          >
            Live Demo
          </div>
        )}
      </div>
    </EmphasisCard>
  );
}

export default LiveDemoCard;
